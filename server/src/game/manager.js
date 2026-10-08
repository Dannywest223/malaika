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
import { getRandomWYRQuestions } from './wyr-questions.js'
import { getRandomKnowMeQuestions } from './knowme-questions.js'
import { shuffleArray } from './truths-prompts.js'

// ==================
// GUESS MY NUMBER
// ==================

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

  let options = null
  if (updatedGuessesUsed === 2) {
    options = generateThreeOptions(targetSecret)
  }

  return {
    round: getRound(roundId),
    feedback,
    guessesLeft: MAX_GUESSES - updatedGuessesUsed,
    options,
  }
}

function generateThreeOptions(secret) {
  const options = new Set()
  options.add(secret)

  const minBound = Math.max(1, secret - 15)
  const maxBound = Math.min(100, secret + 15)

  let attempts = 0
  while (options.size < 3 && attempts < 100) {
    attempts++
    const candidate =
      Math.floor(Math.random() * (maxBound - minBound + 1)) + minBound
    if (candidate !== secret) {
      options.add(candidate)
    }
  }

  while (options.size < 3) {
    const fallback = Math.floor(Math.random() * 100) + 1
    if (fallback !== secret) options.add(fallback)
  }

  const arr = Array.from(options)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }

  return arr
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

  const latest = db.prepare(`
    SELECT * FROM rounds WHERE game_id = ? ORDER BY round_number DESC LIMIT 1
  `).get(gameId)

  if (!latest) return { error: 'No rounds found' }

  if (latest.status !== 'finished') {
    return latest
  }

  if (latest.round_number >= TOTAL_ROUNDS) {
    return { error: 'Game finished' }
  }

  db.prepare('UPDATE games SET current_round = ? WHERE id = ?')
    .run(latest.round_number + 1, gameId)

  return startNewRound(gameId)
}

// ==================
// WOULD YOU RATHER
// ==================

export function startWYRGame(gameId) {
  const game = getGame(gameId)
  if (!game) return { error: 'Game not found' }

  db.prepare(
    'UPDATE games SET player1_score = 0, player2_score = 0, current_round = 1 WHERE id = ?'
  ).run(gameId)

  db.prepare('DELETE FROM wyr_rounds WHERE game_id = ?').run(gameId)

  const questions = getRandomWYRQuestions(20)

  for (let i = 0; i < questions.length; i++) {
    db.prepare(`
      INSERT INTO wyr_rounds (id, game_id, round_number, option_a, option_b, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'picking', ?)
    `).run(nanoid(), gameId, i + 1, questions[i].a, questions[i].b, Date.now())
  }

  return getCurrentWYRRound(gameId)
}

export function getCurrentWYRRound(gameId) {
  return db.prepare(`
    SELECT * FROM wyr_rounds
    WHERE game_id = ? AND status != 'finished'
    ORDER BY round_number ASC
    LIMIT 1
  `).get(gameId)
}

export function getWYRRound(roundId) {
  return db.prepare('SELECT * FROM wyr_rounds WHERE id = ?').get(roundId)
}

export function submitWYRChoice(roundId, playerId, choice) {
  const round = getWYRRound(roundId)
  if (!round) return { error: 'Round not found' }
  if (choice !== 'a' && choice !== 'b') return { error: 'Invalid choice' }

  const game = getGame(round.game_id)
  const isP1 = playerId === game.player1_id
  const isP2 = playerId === game.player2_id

  if (!isP1 && !isP2) return { error: 'Not a player' }

  const col = isP1 ? 'player1_choice' : 'player2_choice'
  db.prepare(`UPDATE wyr_rounds SET ${col} = ? WHERE id = ?`).run(choice, roundId)

  const updated = getWYRRound(roundId)

  if (updated.player1_choice && updated.player2_choice) {
    const matched = updated.player1_choice === updated.player2_choice
    const points = matched ? 5 : 0

    if (matched) {
      db.prepare(
        'UPDATE games SET player1_score = player1_score + 5, player2_score = player2_score + 5 WHERE id = ?'
      ).run(game.id)
    }

    db.prepare('UPDATE wyr_rounds SET status = ? WHERE id = ?').run(
      'finished',
      roundId
    )

    const totalRounds = db
      .prepare('SELECT COUNT(*) as c FROM wyr_rounds WHERE game_id = ?')
      .get(game.id).c

    const isGameOver = round.round_number >= totalRounds

    return {
      round: getWYRRound(roundId),
      roundEnded: true,
      matched,
      points,
      isGameOver,
      game: getGame(game.id),
    }
  }

  return { round: updated, waitingForPartner: true }
}

export function nextWYRRound(gameId) {
  const game = getGame(gameId)
  if (!game) return { error: 'Game not found' }

  const latest = db.prepare(`
    SELECT * FROM wyr_rounds
    WHERE game_id = ?
    ORDER BY round_number DESC
    LIMIT 1
  `).get(gameId)

  if (!latest) return { error: 'No rounds' }
  if (latest.status !== 'finished') return latest

  const totalRounds = db
    .prepare('SELECT COUNT(*) as c FROM wyr_rounds WHERE game_id = ?')
    .get(gameId).c

  if (latest.round_number >= totalRounds) return { error: 'Game finished' }

  db.prepare('UPDATE games SET current_round = ? WHERE id = ?').run(
    latest.round_number + 1,
    gameId
  )

  return db.prepare(`
    SELECT * FROM wyr_rounds
    WHERE game_id = ? AND round_number = ?
    LIMIT 1
  `).get(gameId, latest.round_number + 1)
}

// ==================
// HOW WELL DO YOU KNOW ME
// ==================

export function startKnowMeGame(gameId) {
  const game = getGame(gameId)
  if (!game) return { error: 'Game not found' }

  db.prepare(
    'UPDATE games SET player1_score = 0, player2_score = 0, current_round = 1 WHERE id = ?'
  ).run(gameId)

  db.prepare('DELETE FROM knowme_rounds WHERE game_id = ?').run(gameId)

  return createKnowMeRound(gameId, 1, game.player1_id)
}

function createKnowMeRound(gameId, roundNumber, subjectId) {
  const questions = getRandomKnowMeQuestions(3)
  const id = nanoid()

  db.prepare(`
    INSERT INTO knowme_rounds (
      id, game_id, round_number, subject_id,
      question_1, question_2, question_3,
      status, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, 'answering', ?)
  `).run(
    id,
    gameId,
    roundNumber,
    subjectId,
    questions[0],
    questions[1],
    questions[2],
    Date.now()
  )

  return getKnowMeRound(id)
}

export function getKnowMeRound(roundId) {
  return db.prepare('SELECT * FROM knowme_rounds WHERE id = ?').get(roundId)
}

export function getCurrentKnowMeRound(gameId) {
  return db.prepare(`
    SELECT * FROM knowme_rounds
    WHERE game_id = ? AND status != 'finished'
    ORDER BY round_number ASC
    LIMIT 1
  `).get(gameId)
}

export function submitKnowMeAnswers(roundId, playerId, answers) {
  const round = getKnowMeRound(roundId)
  if (!round) return { error: 'Round not found' }
  if (round.subject_id !== playerId) return { error: 'Not your turn to answer' }

  db.prepare(`
    UPDATE knowme_rounds SET answer_1 = ?, answer_2 = ?, answer_3 = ?, status = 'guessing' WHERE id = ?
  `).run(answers[0], answers[1], answers[2], roundId)

  return { round: getKnowMeRound(roundId) }
}

export function submitKnowMeGuesses(roundId, playerId, guesses) {
  const round = getKnowMeRound(roundId)
  if (!round) return { error: 'Round not found' }
  if (round.subject_id === playerId) return { error: 'Subject cannot guess' }
  if (round.status !== 'guessing') return { error: 'Not in guessing phase' }

  db.prepare(`
    UPDATE knowme_rounds SET guess_1 = ?, guess_2 = ?, guess_3 = ?, status = 'finished' WHERE id = ?
  `).run(guesses[0], guesses[1], guesses[2], roundId)

  const updated = getKnowMeRound(roundId)
  const game = getGame(updated.game_id)

  const normalize = (s) => (s || '').toLowerCase().trim()
  let correct = 0
  if (normalize(updated.guess_1) === normalize(updated.answer_1)) correct++
  if (normalize(updated.guess_2) === normalize(updated.answer_2)) correct++
  if (normalize(updated.guess_3) === normalize(updated.answer_3)) correct++

  const points = correct * 3

  if (playerId === game.player1_id) {
    db.prepare('UPDATE games SET player1_score = player1_score + ? WHERE id = ?').run(points, game.id)
  } else {
    db.prepare('UPDATE games SET player2_score = player2_score + ? WHERE id = ?').run(points, game.id)
  }

  const isGameOver = updated.round_number >= 20

  return {
    round: updated,
    roundEnded: true,
    correct,
    points,
    guesserId: playerId,
    isGameOver,
    game: getGame(game.id),
  }
}

export function nextKnowMeRound(gameId) {
  const game = getGame(gameId)
  if (!game) return { error: 'Game not found' }

  const latest = db.prepare(`
    SELECT * FROM knowme_rounds
    WHERE game_id = ?
    ORDER BY round_number DESC
    LIMIT 1
  `).get(gameId)

  if (!latest) return { error: 'No rounds' }
  if (latest.status !== 'finished') return latest

  if (latest.round_number >= 20) return { error: 'Game finished' }

  const nextRoundNumber = latest.round_number + 1
  const nextSubjectId =
    nextRoundNumber % 2 === 1 ? game.player1_id : game.player2_id

  db.prepare('UPDATE games SET current_round = ? WHERE id = ?').run(
    nextRoundNumber,
    gameId
  )

  return createKnowMeRound(gameId, nextRoundNumber, nextSubjectId)
}

// ==================
// TWO TRUTHS AND A LIE
// ==================

export function startTruthsGame(gameId) {
  const game = getGame(gameId)
  if (!game) return { error: 'Game not found' }

  db.prepare(
    'UPDATE games SET player1_score = 0, player2_score = 0, current_round = 1 WHERE id = ?'
  ).run(gameId)

  db.prepare('DELETE FROM truths_rounds WHERE game_id = ?').run(gameId)

  return createTruthsRound(gameId, 1, game.player1_id)
}

function createTruthsRound(gameId, roundNumber, writerId) {
  const id = nanoid()
  db.prepare(`
    INSERT INTO truths_rounds (id, game_id, round_number, writer_id, status, created_at)
    VALUES (?, ?, ?, ?, 'writing', ?)
  `).run(id, gameId, roundNumber, writerId, Date.now())

  return getTruthsRound(id)
}

export function getTruthsRound(roundId) {
  return db.prepare('SELECT * FROM truths_rounds WHERE id = ?').get(roundId)
}

export function getCurrentTruthsRound(gameId) {
  return db.prepare(`
    SELECT * FROM truths_rounds
    WHERE game_id = ? AND status != 'finished'
    ORDER BY round_number ASC
    LIMIT 1
  `).get(gameId)
}

export function submitTruths(roundId, playerId, statements, lieIndex) {
  const round = getTruthsRound(roundId)
  if (!round) return { error: 'Round not found' }
  if (round.writer_id !== playerId) return { error: 'Not your turn to write' }
  if (!statements || statements.length !== 3) return { error: 'Need 3 statements' }
  if (statements.some((s) => !s || !s.trim())) return { error: 'All statements required' }
  if (lieIndex < 0 || lieIndex > 2) return { error: 'Invalid lie index' }

  const indexed = statements.map((s, i) => ({ text: s.trim(), originalIndex: i }))
  const shuffled = shuffleArray(indexed)
  const newLieIndex = shuffled.findIndex((s) => s.originalIndex === lieIndex)

  db.prepare(`
    UPDATE truths_rounds
    SET statement_1 = ?, statement_2 = ?, statement_3 = ?,
        lie_index = ?, shuffled_order = ?, status = 'guessing'
    WHERE id = ?
  `).run(
    shuffled[0].text,
    shuffled[1].text,
    shuffled[2].text,
    newLieIndex,
    JSON.stringify(shuffled.map((s) => s.originalIndex)),
    roundId
  )

  return { round: getTruthsRound(roundId) }
}

const TRUTHS_ROASTS_CORRECT = [
  'Okay genius, you know me well 😏',
  'You got me this time 🥰',
  'How did you know that?! 😱',
  'I love that you pay attention 💕',
]

const TRUTHS_ROASTS_WRONG = [
  "Babe, you really don't know me huh? 😂",
  'That was so obvious and you still missed 💀',
  'Oof. Try again next round 😘',
  'I see how it is... 💔😂',
]

export function submitTruthsGuess(roundId, playerId, pickIndex) {
  const round = getTruthsRound(roundId)
  if (!round) return { error: 'Round not found' }
  if (round.writer_id === playerId) return { error: 'Writer cannot guess' }
  if (round.status !== 'guessing') return { error: 'Not in guessing phase' }
  if (pickIndex < 0 || pickIndex > 2) return { error: 'Invalid pick' }

  db.prepare(`
    UPDATE truths_rounds SET guesser_pick = ?, status = 'finished' WHERE id = ?
  `).run(pickIndex, roundId)

  const updated = getTruthsRound(roundId)
  const game = getGame(updated.game_id)

  const correct = pickIndex === updated.lie_index
  const points = correct ? 3 : 0

  if (playerId === game.player1_id) {
    db.prepare('UPDATE games SET player1_score = player1_score + ? WHERE id = ?')
      .run(points, game.id)
  } else {
    db.prepare('UPDATE games SET player2_score = player2_score + ? WHERE id = ?')
      .run(points, game.id)
  }

  const isGameOver = updated.round_number >= 20

  const pool = correct ? TRUTHS_ROASTS_CORRECT : TRUTHS_ROASTS_WRONG
  const roast = pool[Math.floor(Math.random() * pool.length)]

  return {
    round: getTruthsRound(roundId),
    roundEnded: true,
    correct,
    points,
    roast,
    guesserId: playerId,
    isGameOver,
    game: getGame(game.id),
  }
}

export function nextTruthsRound(gameId) {
  const game = getGame(gameId)
  if (!game) return { error: 'Game not found' }

  const latest = db.prepare(`
    SELECT * FROM truths_rounds WHERE game_id = ? ORDER BY round_number DESC LIMIT 1
  `).get(gameId)

  if (!latest) return { error: 'No rounds' }
  if (latest.status !== 'finished') return latest

  if (latest.round_number >= 20) return { error: 'Game finished' }

  const nextRoundNumber = latest.round_number + 1
  const nextWriterId =
    nextRoundNumber % 2 === 1 ? game.player1_id : game.player2_id

  db.prepare('UPDATE games SET current_round = ? WHERE id = ?')
    .run(nextRoundNumber, gameId)

  return createTruthsRound(gameId, nextRoundNumber, nextWriterId)
}