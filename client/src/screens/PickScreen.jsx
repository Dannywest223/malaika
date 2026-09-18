import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { socket } from '../socket'

export default function PickScreen({ round, myId, game }) {
  const [num, setNum] = useState('')
  const [waiting, setWaiting] = useState(false)

  const roundNumber = round.round_number
  const pickerId = roundNumber % 2 === 1 ? game.player1_id : game.player2_id
  const guesserId = roundNumber % 2 === 1 ? game.player2_id : game.player1_id

  const iAmPicker = myId === pickerId
  const iAmGuesser = myId === guesserId

  const myScore = myId === game.player1_id ? game.player1_score : game.player2_score
  const herScore = myId === game.player1_id ? game.player2_score : game.player1_score

  const submit = () => {
    const value = parseInt(num)
    if (!value || value < 1 || value > 100) {
      alert('Pick a number between 1 and 100')
      return
    }
    socket.emit('pick_secret', { roundId: round.id, number: value })
    setWaiting(true)
  }

  // If I'm the guesser, show a waiting screen
  if (iAmGuesser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md"
        >
          <div className="text-xs text-rose-soft/60 mb-2">
            Round {roundNumber} of 15
          </div>
          <div className="flex justify-around mb-6 text-sm">
            <div>
              <div className="text-rose-soft/60 text-xs">You</div>
              <div className="text-2xl font-bold text-rose-soft">{myScore}</div>
            </div>
            <div className="text-rose-glow text-2xl">vs</div>
            <div>
              <div className="text-rose-soft/60 text-xs">Malaika</div>
              <div className="text-2xl font-bold text-rose-soft">{herScore}</div>
            </div>
          </div>

          <div className="text-7xl mb-4">💭</div>
          <h2 className="font-display text-3xl text-rose-soft mb-2">
            Her turn to pick
          </h2>
          <p className="text-rose-soft/70 text-sm">
            She's picking a number for you to guess 💕
          </p>
          <div className="mt-6 flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-rose-glow animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  // I'm the picker
  if (waiting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="text-7xl mb-4">🔒</div>
        <h2 className="font-display text-3xl text-rose-soft mb-2">
          Number locked!
        </h2>
        <p className="text-rose-soft/70 text-sm">
          Waiting for her to start guessing...
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center text-xs text-rose-soft/60 mb-2">
          Round {roundNumber} of 15
        </div>

        <div className="flex justify-around mb-6 text-sm">
          <div className="text-center">
            <div className="text-rose-soft/60 text-xs">You</div>
            <div className="text-2xl font-bold text-rose-soft">{myScore}</div>
          </div>
          <div className="text-rose-glow text-2xl self-center">vs</div>
          <div className="text-center">
            <div className="text-rose-soft/60 text-xs">Malaika</div>
            <div className="text-2xl font-bold text-rose-soft">{herScore}</div>
          </div>
        </div>

        <div className="text-center mb-6">
          <div className="text-6xl mb-3">🤫</div>
          <h1 className="font-display text-3xl text-rose-soft mb-2">
            Pick a secret number
          </h1>
          <p className="text-rose-soft/60 text-sm">
            Between 1 and 100 — Malaika will try to guess it
          </p>
        </div>

        <input
          type="number"
          inputMode="numeric"
          value={num}
          onChange={(e) => setNum(e.target.value)}
          placeholder="?"
          className="w-full text-6xl text-center py-6 rounded-3xl bg-white/5 border-2 border-rose-glow/40 text-white font-black outline-none focus:border-rose-glow transition"
          autoFocus
        />

        <button
          onClick={submit}
          disabled={!num}
          className="mt-6 w-full py-5 rounded-2xl bg-gradient-to-r from-rose-glow to-pink-600 text-white font-bold text-xl shadow-glow hover:scale-[1.02] disabled:opacity-40 transition"
        >
          Lock it in 🔒
        </button>
      </motion.div>
    </div>
  )
}