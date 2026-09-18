import { nanoid } from 'nanoid'
import db from '../db.js'
import {
  MAX_GUESSES,
  MIN_NUMBER,
  MAX_NUMBER,
  TOTAL_ROUNDS,
  pointsForGuesses,
  evaluateGuess,
} from './rules.js'

export function createGame(player1Id) {
  const id = nanoid(6).toUpperCase()
  db.prepare(`
    INSERT INTO games (id, player1_id, status, current_round, created_at)
    VALUES (?, ?, 'waiting', 1, ?)
  `).run(id, player1Id, Date.now())
  return getGame(id)
}

export function joinGame(gameId, player2Id) {
  const game = getGame(gameId)
  if (!game) return { error: 'Game not found' }
  if (game.player2_id) return { error: 'Game already full' }

  db.prepare(`
    UPDATE games SET player2_id = ?, status = 'playing' WHERE id = ?
  `).run(player2Id, gameId)

  startNewRound(gameId)
  return { game: getGame(gameId) }
}

export function getGame(gameId) {
  return db.prepare('SELECT * FROM games WHERE id = ?').get(gameId)
}

export function startNewRound(gameId) {
  const game = getGame(gameId)
  const roundNumber = game.current_round
  const roundId = nanoid()

  const pickerId =
    roundNumber % 2 === 1 ? game.player1_id : game.player2_id
  const guesserId =
    roundNumber % 2 === 1 ? game.player2_id : game.player1_id

  db.prepare(`
    INSERT INTO rounds (id, game_id, round_number, turn_player_id, status, created_at)
    VALUES (?, ?, ?, ?, 'picking', ?)
  `).run(roundId, gameId, roundNumber, pickerId, Date.now())

  return getRound(roundId)
}

export function getRound(roundId) {
  return db.prepare('SELECT * FROM rounds WHERE id = ?').get(roundId)
}

export function getCurrentRound(gameId) {
  return db.prepare(`
    SELECT * FROM rounds WHERE game_id = ? ORDER BY round_number DESC LIMIT 1
  `).get(gameId)
}

export function pickSecret(roundId, playerId, number) {
  const round = getRound(roundId)
  if (!round) return { error: 'Round not found' }
  if (number < MIN_NUMBER || number > MAX_NUMBER) {
    return { error: `Number must be ${MIN_NUMBER}-${MAX_NUMBER}` }
  }

  const game = getGame(round.game_id)
  const pickerId =
    round.round_number % 2 === 1 ? game.player1_id : game.player2_id
  const guesserId =
    round.round_number % 2 === 1 ? game.player2_id : game.player1_id

  if (playerId !== pickerId) return { error: 'Not your turn to pick' }

  if (pickerId === game.player1_id) {
    db.prepare('UPDATE rounds SET player1_secret = ? WHERE id = ?')
      .run(number, roundId)
  } else {
    db.prepare('UPDATE rounds SET player2_secret = ? WHERE id = ?')
      .run(number, roundId)
  }

  db.prepare(`
    UPDATE rounds SET status = 'playing', turn_player_id = ? WHERE id = ?
  `).run(guesserId, roundId)

  return { round: getRound(roundId) }
}

export function submitGuess(roundId, playerId, guessValue) {
  const round = getRound(roundId)
  if (!round) return { error: 'Round not found' }
  if (round.status !== 'playing') return { error: 'Round not active' }
  if (round.turn_player_id !== playerId) return { error: 'Not your turn' }

  const game = getGame(round.game_id)
  const pickerId =
    round.round_number % 2 === 1 ? game.player1_id : game.player2_id
  const guesserId =
    round.round_number % 2 === 1 ? game.player2_id : game.player1_id

  if (playerId !== guesserId) return { error: 'You are not the guesser' }

  const targetSecret =
    pickerId === game.player1_id ? round.player1_secret : round.player2_secret

  const guessesUsed =
    guesserId === game.player1_id
      ? round.player1_guesses_used
      : round.player2_guesses_used

  if (guessesUsed >= MAX_GUESSES) return { error: 'No guesses left' }

  const feedback = evaluateGuess(guessValue, targetSecret)

  db.prepare(`
    INSERT INTO guesses (id, round_id, guesser_id, target_player_id, guess_value, feedback, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(nanoid(), roundId, playerId, pickerId, guessValue, feedback, Date.now())

  const newGuessesUsed = guessesUsed + 1
  const found = feedback === 'correct'

  if (guesserId === game.player1_id) {
    db.prepare(`
      UPDATE rounds SET player1_guesses_used = ?, player1_found = ? WHERE id = ?
    `).run(newGuessesUsed, found ? 1 : 0, roundId)
  } else {
    db.prepare(`
      UPDATE rounds SET player2_guesses_used = ?, player2_found = ? WHERE id = ?
    `).run(newGuessesUsed, found ? 1 : 0, roundId)
  }

  const updated = getRound(roundId)
  const updatedGuessesUsed =
    guesserId === game.player1_id
      ? updated.player1_guesses_used
      : updated.player2_guesses_used

  if (found || updatedGuessesUsed >= MAX_GUESSES) {
    return endRound(roundId, guesserId, updatedGuessesUsed, found)
  }

  return {
    round: getRound(roundId),
    feedback,
    guessesLeft: MAX_GUESSES - updatedGuessesUsed,
  }
}

function endRound(roundId, guesserId, guessesUsed, found) {
  const round = getRound(roundId)
  const game = getGame(round.game_id)

  const points = pointsForGuesses(guessesUsed, found)

  if (guesserId === game.player1_id) {
    db.prepare('UPDATE games SET player1_score = player1_score + ? WHERE id = ?')
      .run(points, game.id)
  } else {
    db.prepare('UPDATE games SET player2_score = player2_score + ? WHERE id = ?')
      .run(points, game.id)
  }

  db.prepare('UPDATE rounds SET status = ?, winner_id = ? WHERE id = ?')
    .run('finished', found ? guesserId : null, roundId)

  const isGameOver = round.round_number >= TOTAL_ROUNDS

  if (isGameOver) {
    db.prepare('UPDATE games SET status = ? WHERE id = ?')
      .run('finished', game.id)
  }

  return {
    round: getRound(roundId),
    roundEnded: true,
    guesserId,
    found,
    points,
    isGameOver,
    game: getGame(game.id),
  }
}

export function nextRound(gameId) {
  const game = getGame(gameId)
  if (!game) return { error: 'Game not found' }

  // Find the LATEST round for this game
  const latest = db.prepare(`
    SELECT * FROM rounds WHERE game_id = ? ORDER BY round_number DESC LIMIT 1
  `).get(gameId)

  if (!latest) return { error: 'No rounds found' }

  // If the latest round isn't finished, someone already advanced.
  // Return the current round — do NOT create a new one.
  if (latest.status !== 'finished') {
    return latest
  }

  // If we've hit max rounds, don't advance
  if (latest.round_number >= TOTAL_ROUNDS) {
    return { error: 'Game finished' }
  }

  // Safe to advance
  db.prepare('UPDATE games SET current_round = ? WHERE id = ?')
    .run(latest.round_number + 1, gameId)

  return startNewRound(gameId)
}