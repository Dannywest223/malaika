import { motion } from 'framer-motion'

export default function ScoreBar({ game, myId, round }) {
  if (!game || !myId) return null

  const iAmPlayer1 = myId === game.player1_id

  // My score vs their score
  const myScore = iAmPlayer1 ? game.player1_score : game.player2_score
  const theirScore = iAmPlayer1 ? game.player2_score : game.player1_score

  // My name vs her name — always relative to the viewer
  const myName = 'You'
  const theirName = iAmPlayer1 ? 'Minatallah' : 'Danny'

  const roundNumber = round?.round_number || game.current_round || 1

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-30 backdrop-blur-xl bg-rose-deep/80 border-b border-rose-glow/30"
    >
      <div className="max-w-md mx-auto flex items-center justify-around py-3 px-4">
        <div className="text-center">
          <div className="text-rose-soft/60 text-[10px] uppercase tracking-wider">
            {myName}
          </div>
          <div className="text-2xl font-black text-rose-soft">{myScore}</div>
        </div>

        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-rose-soft/40">
            Round
          </div>
          <div className="text-lg font-bold text-rose-glow">
            {roundNumber}/20
          </div>
        </div>

        <div className="text-center">
          <div className="text-rose-soft/60 text-[10px] uppercase tracking-wider">
            {theirName}
          </div>
          <div className="text-2xl font-black text-rose-soft">{theirScore}</div>
        </div>
      </div>
    </motion.div>
  )
}