import { useState } from 'react'
import { motion } from 'framer-motion'
import { socket } from '../socket'

const GAMES = [
  {
    id: 'number',
    emoji: '🎯',
    title: 'Guess My Number',
    subtitle: 'Pick a number, let them guess',
    duration: '20 rounds',
    ready: true,
    gradient: 'from-rose-glow/30 to-pink-500/20',
    border: 'border-rose-glow/50',
  },
  {
    id: 'wyr',
    emoji: '💕',
    title: 'Would You Rather',
    subtitle: 'Do you two think the same?',
    duration: '20 rounds',
    ready: false,
    gradient: 'from-pink-500/20 to-purple-500/20',
    border: 'border-pink-500/40',
  },
  {
    id: 'knowme',
    emoji: '🧠',
    title: 'How Well Do You Know Me',
    subtitle: 'Do you really know each other?',
    duration: '20 rounds',
    ready: false,
    gradient: 'from-purple-500/20 to-rose-glow/20',
    border: 'border-purple-500/40',
  },
  {
    id: 'truths',
    emoji: '😂',
    title: 'Two Truths and a Lie',
    subtitle: 'Spot the fake',
    duration: '20 rounds',
    ready: false,
    gradient: 'from-rose-glow/20 to-pink-600/20',
    border: 'border-rose-glow/40',
  },
]

export default function GameMenuScreen({ game, myId }) {
  const [selectedGame, setSelectedGame] = useState(null)
  const [waitingForPartner, setWaitingForPartner] = useState(false)

  const chooseGame = (gameType) => {
    if (selectedGame) return // already picked
    setSelectedGame(gameType)
    setWaitingForPartner(true)
    socket.emit('select_game_type', { gameId: game.id, gameType })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-5xl mb-3"
          >
            💘
          </motion.div>
          <h1 className="font-display text-4xl text-rose-soft mb-2">
            Choose a Game
          </h1>
          <p className="text-rose-soft/60 text-sm">
            Pick together — she has to tap the same one
          </p>
        </div>

        {/* Game cards */}
        <div className="space-y-3">
          {GAMES.map((g) => {
            const isSelected = selectedGame === g.id
            const isDisabled = !g.ready || (selectedGame !== null && !isSelected)

            return (
              <motion.button
                key={g.id}
                onClick={() => g.ready && chooseGame(g.id)}
                disabled={isDisabled}
                whileTap={{ scale: g.ready ? 0.97 : 1 }}
                className={`w-full text-left p-5 rounded-3xl border-2 transition ${
                  isSelected
                    ? 'border-green-400 bg-green-500/20 shadow-glow'
                    : g.ready
                    ? `bg-gradient-to-br ${g.gradient} ${g.border} hover:scale-[1.02]`
                    : 'bg-white/5 border-white/10 opacity-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-5xl flex-shrink-0">{g.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-display text-lg text-rose-soft font-bold truncate">
                        {g.title}
                      </div>
                      {!g.ready && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-rose-soft/60 uppercase tracking-wide flex-shrink-0">
                          Soon
                        </span>
                      )}
                    </div>
                    <div className="text-rose-soft/60 text-xs mb-1 truncate">
                      {g.subtitle}
                    </div>
                    <div className="text-rose-soft/40 text-[10px] uppercase tracking-wider">
                      {g.duration}
                    </div>
                  </div>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-2xl flex-shrink-0"
                    >
                      ✅
                    </motion.div>
                  )}
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Waiting message */}
        {waitingForPartner && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-white/5 border border-rose-glow/30 rounded-2xl p-4 text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-rose-soft/60 text-xs">
                Waiting for them to pick the same game
              </span>
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
            <div className="text-rose-soft/40 text-[10px]">
              Both of you must tap the same game
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}