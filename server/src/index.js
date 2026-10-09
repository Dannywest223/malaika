import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { nanoid } from 'nanoid'
import db from './db.js'
import {
  createGame,
  joinGame,
  getGame,
  getCurrentRound,
  pickSecret,
  submitGuess,
  nextRound,
  startNewRound,
  startWYRGame,
  getCurrentWYRRound,
  submitWYRChoice,
  nextWYRRound,
  startKnowMeGame,
  getCurrentKnowMeRound,
  submitKnowMeAnswers,
  submitKnowMeGuesses,
  nextKnowMeRound,
  startTruthsGame,
  getCurrentTruthsRound,
  submitTruths,
  submitTruthsGuess,
  nextTruthsRound,
} from './game/manager.js'

const app = express()
app.use(cors())
app.use(express.json())

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: '*' },
})

app.get('/', (req, res) => res.send('Malaika server is running 🚀'))

const gameSelections = {} // gameId -> { playerId: gameType }
const continueTaps = {} // gameId -> { roundId: Set of playerIds who tapped continue }

io.on('connection', (socket) => {
  console.log('✅ Connected:', socket.id)

  socket.on('create_game', () => {
    const game = createGame(socket.id)
    socket.join(game.id)
    socket.emit('game_created', game)
    console.log('🎮 Game created:', game.id)
  })

  socket.on('join_game', ({ gameId }) => {
    const result = joinGame(gameId, socket.id)
    if (result.error) {
      socket.emit('error_message', result.error)
      return
    }
    socket.join(gameId)

    io.to(gameId).emit('game_started', result.game)
    console.log('👥 Player joined — showing menu:', gameId)
  })

  socket.on('reset_game_status', ({ gameId }) => {
    const game = getGame(gameId)
    if (!game) return
    db.prepare('UPDATE games SET status = ? WHERE id = ?').run('waiting', gameId)
    delete gameSelections[gameId]
    delete continueTaps[gameId]
    console.log('🔄 Reset game status:', gameId)
  })

  socket.on('select_game_type', ({ gameId, gameType }) => {
    console.log(
      '🎯 select_game_type from',
      socket.id.slice(-6),
      '→',
      gameType,
      'for',
      gameId
    )

    const existingGame = getGame(gameId)
    if (!existingGame) return

    if (existingGame.status === 'playing') {
      console.log('   ⚠️ Game status is "playing" — checking for active round')

      let activeRound = null
      if (existingGame.game_type === 'wyr') {
        activeRound = getCurrentWYRRound(gameId)
        if (activeRound && !activeRound.error) {
          socket.emit('wyr_game_started', { gameId })
          socket.emit('wyr_round_started', activeRound)
          console.log('   📤 Resent active WYR round')
          return
        }
      } else if (existingGame.game_type === 'knowme') {
        activeRound = getCurrentKnowMeRound(gameId)
        if (activeRound && !activeRound.error) {
          socket.emit('knowme_game_started', { gameId })
          socket.emit('knowme_round_started', activeRound)
          console.log('   📤 Resent active Know Me round')
          return
        }
      } else if (existingGame.game_type === 'truths') {
        activeRound = getCurrentTruthsRound(gameId)
        if (activeRound && !activeRound.error) {
          socket.emit('truths_game_started', { gameId })
          socket.emit('truths_round_started', activeRound)
          console.log('   📤 Resent active Truths round')
          return
        }
      } else if (existingGame.game_type === 'number') {
        activeRound = getCurrentRound(gameId)
        if (activeRound) {
          socket.emit('round_started', activeRound)
          console.log('   📤 Resent active Number round')
          return
        }
      }

      console.log('   ⚠️ No active round found — resetting game status')
      db.prepare('UPDATE games SET status = ? WHERE id = ?').run(
        'waiting',
        gameId
      )
      existingGame.status = 'waiting'
    }

    if (!gameSelections[gameId]) {
      gameSelections[gameId] = {}
    }
    gameSelections[gameId][socket.id] = gameType

    const p1 = existingGame.player1_id
    const p2 = existingGame.player2_id
    const selections = gameSelections[gameId]

    if (selections[p1] && selections[p2] && selections[p1] === selections[p2]) {
      const chosenType = selections[p1]
      console.log('   ✅ Both picked', chosenType, '— starting game')

      delete gameSelections[gameId]
      continueTaps[gameId] = {}

      db.prepare('UPDATE games SET game_type = ?, status = ? WHERE id = ?').run(
        chosenType,
        'playing',
        gameId
      )

      const updatedGame = getGame(gameId)

      io.to(gameId).emit('game_type_selected', {
        gameType: chosenType,
        game: updatedGame,
      })

      setTimeout(() => {
        if (chosenType === 'number') {
          db.prepare(
            'UPDATE games SET current_round = 1, player1_score = 0, player2_score = 0 WHERE id = ?'
          ).run(gameId)
          db.prepare('DELETE FROM rounds WHERE game_id = ?').run(gameId)

          const round = startNewRound(gameId)
          if (round && !round.error) {
            io.to(gameId).emit('round_started', round)
            console.log('   🚀 Number round 1 started:', round.id)
          }
        } else if (chosenType === 'wyr') {
          const round = startWYRGame(gameId)
          if (round && !round.error) {
            io.to(gameId).emit('wyr_game_started', { gameId })
            io.to(gameId).emit('wyr_round_started', round)
            console.log('   🚀 WYR round 1 started:', round.id)
          }
        } else if (chosenType === 'knowme') {
          const round = startKnowMeGame(gameId)
          if (round && !round.error) {
            io.to(gameId).emit('knowme_game_started', { gameId })
            io.to(gameId).emit('knowme_round_started', round)
            console.log('   🚀 Know Me round 1 started:', round.id)
          }
        } else if (chosenType === 'truths') {
          const round = startTruthsGame(gameId)
          if (round && !round.error) {
            io.to(gameId).emit('truths_game_started', { gameId })
            io.to(gameId).emit('truths_round_started', round)
            console.log('   🚀 Truths round 1 started:', round.id)
          }
        }
      }, 500)
    } else {
      socket.to(gameId).emit('partner_selected', { gameType })
    }
  })

  // ---------- GUESS MY NUMBER ----------

  socket.on('pick_secret', ({ roundId, number }) => {
    const result = pickSecret(roundId, socket.id, number)
    if (result.error) {
      socket.emit('error_message', result.error)
      return
    }
    const game = getGame(result.round.game_id)
    if (result.round.status === 'playing') {
      io.to(game.id).emit('round_ready', result.round)
    } else {
      socket.to(game.id).emit('opponent_ready')
    }
  })

  socket.on('submit_guess', ({ roundId, guess }) => {
    const result = submitGuess(roundId, socket.id, guess)
    if (result.error) {
      socket.emit('error_message', result.error)
      return
    }
    const round = result.round
    const game = getGame(round.game_id)
    if (result.roundEnded) {
      socket.emit('guess_feedback', {
        feedback: result.found ? 'correct' : 'wrong',
        guess,
        round,
      })
      io.to(game.id).emit('round_ended', result)
    } else {
      socket.emit('guess_feedback', {
        feedback: result.feedback,
        guess,
        round,
        guessesLeft: result.guessesLeft,
        options: result.options,
      })
    }
  })

  socket.on('next_round', ({ gameId, roundId }) => {
    if (!continueTaps[gameId]) continueTaps[gameId] = {}
    if (!continueTaps[gameId][roundId]) continueTaps[gameId][roundId] = new Set()
    continueTaps[gameId][roundId].add(socket.id)

    const game = getGame(gameId)
    if (!game) return

    const bothTapped =
      continueTaps[gameId][roundId].has(game.player1_id) &&
      continueTaps[gameId][roundId].has(game.player2_id)

    if (!bothTapped) {
      socket.to(gameId).emit('partner_tapped_continue')
      return
    }

    delete continueTaps[gameId][roundId]

    const result = nextRound(gameId)
    if (result.error) {
      console.log('next_round error (ignored):', result.error)
      return
    }
    io.to(gameId).emit('round_started', result)
    console.log('🔄 New number round:', result.round_number)
  })

  // ---------- WOULD YOU RATHER ----------

  socket.on('wyr_submit_choice', ({ roundId, choice }) => {
    const result = submitWYRChoice(roundId, socket.id, choice)
    if (result.error) {
      socket.emit('error_message', result.error)
      return
    }
    if (result.roundEnded) {
      const game = getGame(result.round.game_id)
      io.to(game.id).emit('wyr_round_ended', result)
      console.log('💕 WYR round ended — matched:', result.matched)
    } else {
      socket.emit('wyr_waiting_for_partner', { round: result.round })
    }
  })

  socket.on('wyr_next_round', ({ gameId, roundId }) => {
    if (!continueTaps[gameId]) continueTaps[gameId] = {}
    if (!continueTaps[gameId][roundId]) continueTaps[gameId][roundId] = new Set()
    continueTaps[gameId][roundId].add(socket.id)

    const game = getGame(gameId)
    if (!game) return

    const bothTapped =
      continueTaps[gameId][roundId].has(game.player1_id) &&
      continueTaps[gameId][roundId].has(game.player2_id)

    if (!bothTapped) {
      socket.to(gameId).emit('partner_tapped_continue')
      return
    }

    delete continueTaps[gameId][roundId]

    const round = nextWYRRound(gameId)
    if (round.error) {
      console.log('wyr_next_round (ignored):', round.error)
      return
    }
    io.to(gameId).emit('wyr_round_started', round)
    console.log('🔄 New WYR round:', round.round_number)
  })

  socket.on('wyr_request_current_round', ({ gameId }) => {
    const round = getCurrentWYRRound(gameId)
    if (round && !round.error) {
      socket.emit('wyr_round_started', round)
      console.log('📤 Resent WYR round to', socket.id.slice(-6))
    }
  })

  // ---------- HOW WELL DO YOU KNOW ME ----------

  socket.on('knowme_submit_answers', ({ roundId, answers }) => {
    const result = submitKnowMeAnswers(roundId, socket.id, answers)
    if (result.error) {
      socket.emit('error_message', result.error)
      return
    }
    const game = getGame(result.round.game_id)
    io.to(game.id).emit('knowme_answers_submitted', result.round)
    console.log('🧠 Know Me answers submitted')
  })

  socket.on('knowme_submit_guesses', ({ roundId, guesses }) => {
    const result = submitKnowMeGuesses(roundId, socket.id, guesses)
    if (result.error) {
      socket.emit('error_message', result.error)
      return
    }
    const game = getGame(result.round.game_id)
    io.to(game.id).emit('knowme_round_ended', result)
    console.log('🧠 Know Me — correct:', result.correct, '| points:', result.points)
  })

  socket.on('knowme_next_round', ({ gameId, roundId }) => {
    if (!continueTaps[gameId]) continueTaps[gameId] = {}
    if (!continueTaps[gameId][roundId]) continueTaps[gameId][roundId] = new Set()
    continueTaps[gameId][roundId].add(socket.id)

    const game = getGame(gameId)
    if (!game) return

    const bothTapped =
      continueTaps[gameId][roundId].has(game.player1_id) &&
      continueTaps[gameId][roundId].has(game.player2_id)

    if (!bothTapped) {
      socket.to(gameId).emit('partner_tapped_continue')
      return
    }

    delete continueTaps[gameId][roundId]

    const round = nextKnowMeRound(gameId)
    if (round.error) return
    io.to(gameId).emit('knowme_round_started', round)
    console.log('🔄 New Know Me round:', round.round_number)
  })

  socket.on('knowme_request_current_round', ({ gameId }) => {
    const round = getCurrentKnowMeRound(gameId)
    if (round && !round.error) {
      socket.emit('knowme_round_started', round)
      console.log('📤 Resent Know Me round to', socket.id.slice(-6))
    }
  })

  // ---------- TWO TRUTHS AND A LIE ----------

  socket.on('truths_submit_statements', ({ roundId, statements, lieIndex }) => {
    const result = submitTruths(roundId, socket.id, statements, lieIndex)
    if (result.error) {
      socket.emit('error_message', result.error)
      return
    }
    const game = getGame(result.round.game_id)
    io.to(game.id).emit('truths_statements_submitted', result.round)
    console.log('😂 Truths statements submitted')
  })

  socket.on('truths_submit_guess', ({ roundId, pickIndex }) => {
    const result = submitTruthsGuess(roundId, socket.id, pickIndex)
    if (result.error) {
      socket.emit('error_message', result.error)
      return
    }
    const game = getGame(result.round.game_id)
    io.to(game.id).emit('truths_round_ended', result)
    console.log('😂 Truths — correct:', result.correct, '| points:', result.points)
  })

  socket.on('truths_next_round', ({ gameId, roundId }) => {
    if (!continueTaps[gameId]) continueTaps[gameId] = {}
    if (!continueTaps[gameId][roundId]) continueTaps[gameId][roundId] = new Set()
    continueTaps[gameId][roundId].add(socket.id)

    const game = getGame(gameId)
    if (!game) return

    const bothTapped =
      continueTaps[gameId][roundId].has(game.player1_id) &&
      continueTaps[gameId][roundId].has(game.player2_id)

    if (!bothTapped) {
      socket.to(gameId).emit('partner_tapped_continue')
      return
    }

    delete continueTaps[gameId][roundId]

    const round = nextTruthsRound(gameId)
    if (round.error) return
    io.to(gameId).emit('truths_round_started', round)
    console.log('🔄 New Truths round:', round.round_number)
  })

  socket.on('truths_request_current_round', ({ gameId }) => {
    const round = getCurrentTruthsRound(gameId)
    if (round && !round.error) {
      socket.emit('truths_round_started', round)
      console.log('📤 Resent Truths round to', socket.id.slice(-6))
    }
  })

  socket.on('truths_reaction', ({ gameId, emoji }) => {
    io.to(gameId).emit('truths_reaction', { emoji, senderId: socket.id })
  })

  // ---------- CHAT ----------

  socket.on('send_message', ({ gameId, content, type = 'text' }) => {
    if (!content || !content.trim()) return
    const id = nanoid()
    db.prepare(`
      INSERT INTO messages (id, game_id, sender_id, content, type, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, gameId, socket.id, content.trim(), type, Date.now())

    const message = {
      id,
      game_id: gameId,
      sender_id: socket.id,
      content: content.trim(),
      type,
      created_at: Date.now(),
    }
    io.to(gameId).emit('new_message', message)
  })

  socket.on('load_messages', ({ gameId }) => {
    const rows = db.prepare(`
      SELECT * FROM messages WHERE game_id = ? ORDER BY created_at ASC LIMIT 200
    `).all(gameId)
    socket.emit('message_history', rows)
  })

  socket.on('disconnect', () => {
    console.log('❌ Disconnected:', socket.id)
  })
})

const PORT = process.env.PORT || 4000
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})