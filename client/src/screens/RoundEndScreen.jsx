import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { socket } from '../socket'

export default function RoundEndScreen({ round, game, myId, setScreen, roundResult }) {
  const [advancing, setAdvancing] = useState(false)

  const isGameOver = roundResult?.isGameOver
  const guesserId = roundResult?.guesserId
  const found = roundResult?.found
  const points = roundResult?.points || 0

  const iWasGuesser = guesserId === myId
  const roundNumber = round.round_number

  // Which round's picker should fire the next_round event?
  // Previous round's picker = the person who did NOT just guess
  const previousPickerId =
    roundNumber % 2 === 1 ? game.player1_id : game.player2_id

  // Only the previous picker fires next_round (avoids double-fire)
  const iShouldFireNextRound = myId === previousPickerId

  const myScore = myId === game.player1_id ? game.player1_score : game.player2_score
  const herScore = myId === game.player1_id ? game.player2_score : game.player1_score

  const realSecret =
    roundNumber % 2 === 1 ? round.player1_secret : round.player2_secret

  const advance = () => {
    if (advancing) return
    if (!iShouldFireNextRound) return
    setAdvancing(true)
    socket.emit('next_round', { gameId: game.id })
  }

  useEffect(() => {
    if (isGameOver) {
      const t = setTimeout(() => setScreen('gameOver'), 2500)
      return () => clearTimeout(t)
    }

    // INSTANT advance — 700ms so she can read the result, then move on
    if (iShouldFireNextRound) {
      const t = setTimeout(advance, 700)
      return () => clearTimeout(t)
    }
  }, [isGameOver, iShouldFireNextRound])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-24 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-7xl mb-3">
          {found ? (iWasGuesser ? '🏆' : '💔') : '😅'}
        </div>

        <h1 className="font-display text-4xl text-rose-soft mb-2">
          {found
            ? iWasGuesser
              ? 'You got it! 🎉'
              : 'She got it! 💕'
            : 'Nobody got it 😅'}
        </h1>

        <p className="text-rose-soft/70 text-sm mb-6">
          The number was{' '}
          <span className="text-rose-glow font-bold text-xl">{realSecret}</span>
        </p>

        {found && (
          <div className="mb-6 text-lg">
            {iWasGuesser ? (
              <span className="text-green-400 font-bold">
                +{points} point{points === 1 ? '' : 's'} for you!
              </span>
            ) : (
              <span className="text-rose-soft font-bold">
                +{points} point{points === 1 ? '' : 's'} for Malaika!
              </span>
            )}
          </div>
        )}

        {!found && (
          <div className="mb-6 text-lg text-rose-soft/60">
            No points this round
          </div>
        )}

        <div className="bg-white/5 rounded-2xl p-5 mb-6 border border-rose-glow/30">
          <div className="text-xs text-rose-soft/60 mb-2">Running Total</div>
          <div className="flex justify-around items-center">
            <div>
              <div className="text-rose-soft/60 text-xs">You</div>
              <div className="text-3xl font-black text-rose-soft">{myScore}</div>
            </div>
            <div className="text-rose-glow text-2xl">vs</div>
            <div>
              <div className="text-rose-soft/60 text-xs">Malaika</div>
              <div className="text-3xl font-black text-rose-soft">{herScore}</div>
            </div>
          </div>
        </div>

        {!isGameOver && (
          <p className="text-rose-soft/40 text-xs">
            Round {roundNumber + 1} starting...
          </p>
        )}

        {isGameOver && (
          <p className="text-rose-glow text-sm animate-pulse">
            Final results coming... 💘
          </p>
        )}
      </motion.div>
    </div>
  )
}