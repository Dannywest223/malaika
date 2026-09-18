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

app.get('/', (req, res) => res.send('Guess My Number server is running 🚀'))

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