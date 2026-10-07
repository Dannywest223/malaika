import { useState } from 'react'
import { motion } from 'framer-motion'

export default function LobbyScreen({ game }) {
  const [copied, setCopied] = useState(false)

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(game?.id || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.log('Copy failed:', err)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md text-center"
      >
        {/* Animated heart */}
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-7xl mb-4"
        >
          💕
        </motion.div>

        <h2 className="font-display text-3xl text-rose-soft mb-2">
          Waiting for her...
        </h2>
        <p className="text-rose-soft/70 text-sm mb-8">
          Send this code to Minatallah Emad Ahmed
        </p>

        {/* Code display */}
        <div className="bg-white/5 border-2 border-rose-glow/40 rounded-3xl p-6 mb-4">
          <div className="text-[10px] text-rose-soft/60 uppercase tracking-widest mb-2">
            Your room code
          </div>
          <div className="font-display text-5xl font-black text-rose-glow tracking-[0.3em] mb-4">
            {game?.id || '------'}
          </div>

          <button
            onClick={copyCode}
            className={`w-full py-3 rounded-2xl font-bold text-sm transition ${
              copied
                ? 'bg-green-500/30 border-2 border-green-400 text-green-300'
                : 'bg-gradient-to-r from-rose-glow to-pink-600 text-white shadow-glow hover:scale-[1.02]'
            }`}
          >
            {copied ? '✅ Copied!' : '📋 Copy code'}
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-white/5 border border-rose-glow/20 rounded-2xl p-5 text-left mb-6">
          <div className="text-xs text-rose-soft/60 uppercase tracking-widest mb-3">
            How she joins
          </div>
          <ol className="text-rose-soft/80 text-sm space-y-2">
            <li className="flex gap-2">
              <span className="text-rose-glow font-bold">1.</span>
              <span>She opens the same link</span>
            </li>
            <li className="flex gap-2">
              <span className="text-rose-glow font-bold">2.</span>
              <span>
                She taps{' '}
                <span className="text-rose-soft font-semibold">
                  "Join His Game 💌"
                </span>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-rose-glow font-bold">3.</span>
              <span>
                She enters the code{' '}
                <span className="text-rose-glow font-bold">{game?.id}</span>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-rose-glow font-bold">4.</span>
              <span>You both pick a game together 💘</span>
            </li>
          </ol>
        </div>

        {/* Waiting dots */}
        <div className="flex justify-center items-center gap-2">
          <span className="text-rose-soft/50 text-xs">Waiting for her</span>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-1.5 h-1.5 rounded-full bg-rose-glow"
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}