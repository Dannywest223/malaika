import { useState } from 'react'
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

  const submit = () => {
    const value = parseInt(num)
    if (!value || value < 1 || value > 100) {
      alert('Pick a number between 1 and 100')
      return
    }
    socket.emit('pick_secret', { roundId: round.id, number: value })
    setWaiting(true)
  }

  // ---- I'm the guesser, so it's HER turn to pick ----
  if (iAmGuesser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md"
        >
          <div className="text-7xl mb-4">💭</div>
          <h2 className="font-display text-3xl text-rose-soft mb-2">
            Minatallah's turn to pick
          </h2>
          <p className="text-rose-soft/70 text-sm">
            She's picking a number for you to guess 💕
          </p>
          <div className="mt-6 flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                className="w-2 h-2 rounded-full bg-rose-glow"
              />
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  // ---- I picked but she hasn't started guessing yet ----
  if (waiting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md"
        >
          <div className="text-7xl mb-4">🔒</div>
          <h2 className="font-display text-3xl text-rose-soft mb-2">
            Number locked!
          </h2>
          <p className="text-rose-soft/70 text-sm mb-8">
            Waiting for Minatallah to start guessing...
          </p>

          <div className="bg-white/5 border border-rose-glow/30 rounded-2xl px-6 py-4 inline-block">
            <div className="text-[10px] text-rose-soft/60 uppercase tracking-widest mb-1">
              Your secret number
            </div>
            <div className="text-4xl font-black text-rose-glow">{num}</div>
          </div>
        </motion.div>
      </div>
    )
  }

  // ---- I'm the picker ----
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-24">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">🤫</div>
          <h1 className="font-display text-3xl text-rose-soft mb-2">
            Pick a secret number
          </h1>
          <p className="text-rose-soft/60 text-sm">
            Between 1 and 100 — Minatallah will try to guess it
          </p>
        </div>

        <input
          type="number"
          inputMode="numeric"
          value={num}
          onChange={(e) => setNum(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="?"
          className="w-full text-6xl text-center py-6 rounded-3xl bg-white/5 border-2 border-rose-glow/40 text-white font-black outline-none focus:border-rose-glow transition"
          autoFocus
        />

        <button
          onClick={submit}
          disabled={!num}
          className="mt-6 w-full py-5 rounded-2xl bg-gradient-to-r from-rose-glow to-pink-600 text-white font-bold text-xl shadow-glow hover:scale-[1.02] active:scale-95 disabled:opacity-40 transition"
        >
          Lock it in 🔒
        </button>

        <p className="text-center text-rose-soft/40 text-xs mt-4">
          Tip: pick something she would never guess 😏
        </p>
      </motion.div>
    </div>
  )
}