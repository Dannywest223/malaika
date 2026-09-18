import { nanoid } from 'nanoid'
import db from '../db.js'
import { MAX_GUESSES, MIN_NUMBER, MAX_NUMBER, pointsForGuesses, evaluateGuess } from './rules.js'

// ---- GAME CREATION ----

export function createGame(player1Id) {
  const id = nanoid(6).toUpperCase() // short room code like "A3F9K2"
  db.prepare(`
    INSERT INTO games (id, player1_id, status, created_at)
    VALUES (?, ?, 'waiting', ?)
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

// ---- ROUND MANAGEMENT ----

export function startNewRound(gameId) {
  const game = getGame(gameId)
  const roundId = nanoid()
  const roundNumber = game.current_round

  db.prepare(`
    INSERT INTO rounds (id, game_id, round_number, status, created_at)
    VALUES (?, ?, ?, 'picking', ?)
  `).run(roundId, gameId, roundNumber, Date.now())

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

// ---- PICKING SECRET NUMBERS ----

export function pickSecret(roundId, playerId, number) {
  const round = getRound(roundId)
  if (!round) return { error: 'Round not found' }
  if (number < MIN_NUMBER || number > MAX_NUMBER) {
    return { error: `Number must be ${MIN_NUMBER}-${MAX_NUMBER}` }
  }

  const game = getGame(round.game_id)
  const isPlayer1 = playerId === game.player1_id

  if (isPlayer1) {
    db.prepare('UPDATE rounds SET player1_secret = ? WHERE id = ?').run(number, roundId)
  } else {
    db.prepare('UPDATE rounds SET player2_secret = ? WHERE id = ?').run(number, roundId)
  }

  const updated = getRound(roundId)

  // Both picked? Start playing. Player1 goes first.
  if (updated.player1_secret != null && updated.player2_secret != null) {
    db.prepare(`
      UPDATE rounds SET status = 'playing', turn_player_id = ? WHERE id = ?
    `).run(game.player1_id, roundId)
  }

  return { round: getRound(roundId) }
}

// ---- SUBMITTING GUESSES ----

export function submitGuess(roundId, playerId, guessValue) {
  const round = getRound(roundId)
  if (!round) return { error: 'Round not found' }
  if (round.status !== 'playing') return { error: 'Round not active' }
  if (round.turn_player_id !== playerId) return { error: 'Not your turn' }

  const game = getGame(round.game_id)
  const isPlayer1 = playerId === game.player1_id

  // Check guess limit
  const guessesUsed = isPlayer1 ? round.player1_guesses_used : round.player2_guesses_used
  if (guessesUsed >= MAX_GUESSES) return { error: 'No guesses left' }

  // Which secret are we comparing against?
  const targetSecret = isPlayer1 ? round.player2_secret : round.player1_secret
  const targetPlayerId = isPlayer1 ? game.player2_id : game.player1_id

  const feedback = evaluateGuess(guessValue, targetSecret)

  // Log the guess
  db.prepare(`
    INSERT INTO guesses (id, round_id, guesser_id, target_player_id, guess_value, feedback, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(nanoid(), roundId, playerId, targetPlayerId, guessValue, feedback, Date.now())

  // Update round counters
  const newGuessesUsed = guessesUsed + 1
  const found = feedback === 'correct'

  if (isPlayer1) {
    db.prepare(`
      UPDATE rounds SET player1_guesses_used = ?, player1_found = ? WHERE id = ?
    `).run(newGuessesUsed, found ? 1 : 0, roundId)
  } else {
    db.prepare(`
      UPDATE rounds SET player2_guesses_used = ?, player2_found = ? WHERE id = ?
    `).run(newGuessesUsed, found ? 1 : 0, roundId)
  }

  const updated = getRound(roundId)

  // Did the round end?
  const p1Done = updated.player1_found || updated.player1_guesses_used >= MAX_GUESSES
  const p2Done = updated.player2_found || updated.player2_guesses_used >= MAX_GUESSES

  if (p1Done && p2Done) {
    return endRound(roundId)
  }

  // Otherwise, switch turns
  const nextTurn = isPlayer1 ? game.player2_id : game.player1_id
  db.prepare('UPDATE rounds SET turn_player_id = ? WHERE id = ?').run(nextTurn, roundId)

  return { round: getRound(roundId), feedback }
}

// ---- ROUND END + SCORING ----

function endRound(roundId) {
  const round = getRound(roundId)
  const game = getGame(round.game_id)

  const p1Points = pointsForGuesses(round.player1_guesses_used, round.player1_found)
  const p2Points = pointsForGuesses(round.player2_guesses_used, round.player2_found)

  let winnerId = null
  if (p1Points > p2Points) winnerId = game.player1_id
  else if (p2Points > p1Points) winnerId = game.player2_id

  db.prepare('UPDATE rounds SET status = ?, winner_id = ? WHERE id = ?')
    .run('finished', winnerId, roundId)

  // Add to game scores
  db.prepare(`
    UPDATE games SET
      player1_score = player1_score + ?,
      player2_score = player2_score + ?
    WHERE id = ?
  `).run(p1Points, p2Points, game.id)

  return {
    round: getRound(roundId),
    roundEnded: true,
    roundWinnerId: winnerId,
    p1Points,
    p2Points,
    game: getGame(game.id),
  }
}

// ---- NEXT ROUND ----

export function nextRound(gameId) {
  const game = getGame(gameId)
  db.prepare('UPDATE games SET current_round = current_round + 1 WHERE id = ?').run(gameId)
  return startNewRound(gameId)
}