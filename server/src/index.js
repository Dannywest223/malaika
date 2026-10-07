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
} from './game/manager.js'

const app = express()
app.use(cors())
app.use(express.json())

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: '*' },
})

app.get('/', (req, res) => res.send('Malaika server is running 🚀'))

// Track both players' game selections so we only start when they match
const gameSelections = {} // gameId -> { playerId: gameType }

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

    const round = getCurrentRound(gameId)
    io.to(gameId).emit('round_started', round)
    console.log('👥 Player joined:', gameId)
  })

  // NEW: both players must select the same game to start
  socket.on('select_game_type', ({ gameId, gameType }) => {
    if (!gameSelections[gameId]) {
      gameSelections[gameId] = {}
    }
    gameSelections[gameId][socket.id] = gameType

    const game = getGame(gameId)
    if (!game) return

    const selections = gameSelections[gameId]
    const playerIds = [game.player1_id, game.player2_id]

    // Both selected the same game?
    if (
      playerIds.every((pid) => selections[pid]) &&
      selections[game.player1_id] === selections[game.player2_id]
    ) {
      const chosenType = selections[game.player1_id]

      // Save to DB
      db.prepare('UPDATE games SET game_type = ? WHERE id = ?').run(
        chosenType,
        gameId
      )

      const updatedGame = getGame(gameId)

      // Tell both players
      io.to(gameId).emit('game_type_selected', {
        gameType: chosenType,
        game: updatedGame,
      })

      // For now, only the number game has a round flow
      if (chosenType === 'number') {
        const round = getCurrentRound(gameId) || nextRound(gameId)
        if (round && !round.error) {
          io.to(gameId).emit('round_started', round)
        }
      }

      // Clear selection so a new selection can happen next time
      delete gameSelections[gameId]

      console.log('🎲 Game type selected:', chosenType, 'for', gameId)
    } else {
      // Let the other player know their partner picked something
      socket.to(gameId).emit('partner_selected', { gameType })
    }
  })

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

  socket.on('next_round', ({ gameId }) => {
    const result = nextRound(gameId)
    if (result.error) {
      console.log('next_round error (ignored):', result.error)
      return
    }
    io.to(gameId).emit('round_started', result)
    console.log('🔄 New round:', result.round_number)
  })

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