import { useState } from 'react'
import { motion } from 'framer-motion'
import { socket } from '../socket'

export default function HomeScreen() {
  const [code, setCode] = useState('')
  const [joining, setJoining] = useState(false)

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-10 z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md"
      >
        {/* Her photo in a romantic frame */}
        <div className="relative mx-auto mb-8 w-52 h-52 sm:w-64 sm:h-64">
          {/* Glow behind the image */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-rose-glow via-pink-400 to-purple-500 blur-3xl opacity-50 animate-pulse" />

          {/* Rotating dashed ring accent */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="absolute -inset-3 rounded-full border border-dashed border-rose-glow/30"
          />

          {/* The image in a circle */}
          <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-rose-glow/60 shadow-glow bg-rose-deep/50">
            <img
              src="/minatallah.jpg"
              alt="Minatallah Emad Ahmed"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.parentElement.innerHTML =
                  '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:64px">💕</div>'
              }}
            />
          </div>

          {/* Floating hearts around the frame */}
          <motion.div
            animate={{ y: [0, -8, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-2 -right-2 text-3xl"
          >
            💖
          </motion.div>
          <motion.div
            animate={{ y: [0, -10, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
            className="absolute -bottom-1 -left-1 text-2xl"
          >
            💕
          </motion.div>
        </div>

        {/* Names */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl sm:text-4xl text-rose-soft mb-2 tracking-wide leading-tight">
            Danny <span className="text-rose-glow">&</span>
            <br />
            <span className="text-2xl sm:text-3xl">Minatallah Emad Ahmed</span>
          </h1>
          <p className="text-rose-soft/70 text-xs sm:text-sm italic">
            A game made just for you, my love 💘
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => socket.emit('create_game')}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-glow to-pink-500 text-white font-bold text-lg shadow-glow hover:scale-[1.02] active:scale-95 transition"
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
              className="w-full py-4 rounded-2xl bg-white/5 border border-rose-glow/40 text-rose-soft font-semibold hover:bg-white/10 active:scale-95 transition"
            >
              Join His Game 💌
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
                className="w-full py-4 rounded-2xl bg-white/5 border border-rose-glow/40 text-center text-2xl tracking-[0.5em] text-white placeholder-rose-soft/30 outline-none focus:border-rose-glow transition"
                autoFocus
              />
              <button
                onClick={() => socket.emit('join_game', { gameId: code })}
                disabled={code.length < 4}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-glow to-pink-500 text-white font-bold shadow-glow disabled:opacity-50 active:scale-95 transition"
              >
                Join 💘
              </button>
            </motion.div>
          )}
        </div>

        <p className="text-center text-rose-soft/40 text-[10px] mt-8">
          Made with 💗 by Danny for Minatallah Emad Ahmed
        </p>
      </motion.div>
    </div>
  )
}