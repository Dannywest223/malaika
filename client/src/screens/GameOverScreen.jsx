import { motion } from 'framer-motion'

const FUNNY_YOU_WIN = [
  "You owe me a kiss for every point I won 💋",
  "Malaika, this means I get to pick our next date 😏",
  "Looks like I know you better than you know me 😘",
  "Winner gets unlimited cuddles tonight — that's me 💕",
]

const FUNNY_SHE_WINS = [
  "Okay Malaika, you win this time... but only because I let you 😏",
  "You're too smart for me, and I love it 🥰",
  "I owe you dinner and dessert — you earned it, my love 💘",
  "My queen won. As always 👑💕",
]

const FUNNY_DRAW = [
  "A tie?! This means we're soulmates 💕",
  "Perfectly matched, just like we always knew 🥰",
  "We're literally the same person, it's official 😘",
]

export default function GameOverScreen({ game, myId, onRematch }) {
  const myScore = myId === game.player1_id ? game.player1_score : game.player2_score
  const herScore = myId === game.player1_id ? game.player2_score : game.player1_score

  const iWon = myScore > herScore
  const isDraw = myScore === herScore

  const messages = isDraw ? FUNNY_DRAW : iWon ? FUNNY_YOU_WIN : FUNNY_SHE_WINS
  const message = messages[Math.floor(Math.random() * messages.length)]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
          transition={{ duration: 1 }}
          className="text-7xl mb-4"
        >
          {isDraw ? '🤝' : iWon ? '🏆' : '👑'}
        </motion.div>

        <h1 className="font-display text-5xl text-rose-soft mb-2">
          Game Over
        </h1>
        <p className="text-rose-soft/60 text-sm mb-8">
  20 rounds of love and competition 💕
</p>

        {/* Final scores */}
        <div className="bg-gradient-to-br from-rose-glow/20 to-purple-500/10 border-2 border-rose-glow/40 rounded-3xl p-6 mb-6 shadow-glow">
          <div className="flex justify-around items-center">
            <div className="text-center">
              <div className="text-rose-soft/60 text-xs mb-1">You</div>
              <div className="text-5xl font-black text-rose-soft">{myScore}</div>
            </div>
            <div className="text-rose-glow text-3xl font-bold">vs</div>
            <div className="text-center">
              <div className="text-rose-soft/60 text-xs mb-1">Malaika</div>
              <div className="text-5xl font-black text-rose-soft">{herScore}</div>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/5 border border-rose-glow/30 rounded-2xl p-5 mb-8"
        >
          <p className="font-display text-xl text-rose-soft leading-relaxed">
            {message}
          </p>
        </motion.div>

        <button
          onClick={onRematch}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-glow to-pink-600 text-white font-bold text-xl shadow-glow hover:scale-[1.02] transition"
        >
          Rematch 💘
        </button>

        <p className="text-rose-soft/40 text-xs mt-6">
          Made with 💗 by Danny for Malaika
        </p>
      </motion.div>
    </div>
  )
}