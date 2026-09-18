import { useState } from 'react'
import { motion } from 'framer-motion'
import { socket } from '../socket'

export default function HomeScreen() {
  const [code, setCode] = useState('')
  const [joining, setJoining] = useState(false)

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md"
      >
        {/* Her photo in a romantic frame */}
        <div className="relative mx-auto mb-8 w-40 h-40">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-rose-glow via-pink-400 to-purple-500 blur-2xl opacity-60 animate-pulse" />
          <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-rose-glow/60 shadow-glow">
            <img
              src="/malaika.jpg"
              alt="Malaika"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.parentElement.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:64px">💕</div>'
              }}
            />
          </div>
          <div className="absolute -bottom-2 -right-2 text-3xl">💖</div>
        </div>

        {/* Names */}
        <h1 className="font-display text-5xl text-center text-rose-soft mb-2 tracking-wide">
          Danny <span className="text-rose-glow">&</span> Malaika
        </h1>
        <p className="text-center text-rose-soft/70 text-sm mb-8 italic">
          A game made just for you, my love 💘
        </p>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => socket.emit('create_game')}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-glow to-pink-500 text-white font-bold text-lg shadow-glow hover:scale-[1.02] active:scale-95"
          >
            Create Our Game 💕
          </button>

          <div className="flex items-center gap-3 text-rose-soft/40 text-xs">
            <div className="flex-1 h-px bg-rose-soft/20" />
            <span>or join with code</span>
            <div className="flex-1 h-px bg-rose-soft/20" />
          </div>

          {!joining ? (
            <button
              onClick={() => setJoining(true)}
              className="w-full py-4 rounded-2xl bg-white/5 border border-rose-glow/40 text-rose-soft font-semibold hover:bg-white/10"
            >
              Join Her Game 💌
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE"
                maxLength={6}
                className="w-full py-4 rounded-2xl bg-white/5 border border-rose-glow/40 text-center text-2xl tracking-[0.5em] text-white placeholder-rose-soft/30 outline-none focus:border-rose-glow"
                autoFocus
              />
              <button
                onClick={() => socket.emit('join_game', { gameId: code })}
                disabled={code.length < 4}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-glow to-pink-500 text-white font-bold shadow-glow disabled:opacity-50"
              >
                Join 💘
              </button>
            </motion.div>
          )}
        </div>

        <p className="text-center text-rose-soft/40 text-xs mt-8">
          Made with 💗 by Danny for Malaika
        </p>
      </motion.div>
    </div>
  )
}