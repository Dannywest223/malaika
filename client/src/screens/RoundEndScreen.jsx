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

  // The previous round's picker = whoever did NOT just guess
  const previousPickerId =
    roundNumber % 2 === 1 ? game.player1_id : game.player2_id

  // Only the previous picker fires next_round (avoids double-fire)
  const iShouldFireNextRound = myId === previousPickerId

  const myScore = myId === game.player1_id ? game.player1_score : game.player2_score
  const herScore = myId === game.player1_id ? game.player2_score : game.player1_score

  const realSecret =
    roundNumber % 2 === 1 ? round.player1_secret : round.player2_secret

  // Pick a random funny line for each outcome
  const funnyYouGotIt = [
    'You are too smart 💘',
    'Okay okay, next time I pick harder 🔥',
    'That was pure luck 😏',
    'I knew you would get it, my love 💕',
  ]
  const funnySheGotIt = [
    'My baby is too smart 🥰',
    'You always find me 💕',
    'Okay genius, next round 😘',
    'I love how your mind works 💗',
  ]
  const funnyNobody = [
    'We both failed 😂',
    'Well that was embarrassing...',
    'Next one is ours 🤝',
    'We clearly need more practice 💕',
  ]

  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)]

  const [funnyLine] = useState(() =>
    found
      ? iWasGuesser
        ? pickRandom(funnyYouGotIt)
        : pickRandom(funnySheGotIt)
      : pickRandom(funnyNobody)
  )

  const advance = () => {
    if (advancing) return
    if (!iShouldFireNextRound) return
    setAdvancing(true)
    socket.emit('next_round', { gameId: game.id })
  }

  useEffect(() => {
    if (isGameOver) {
      const t = setTimeout(() => setScreen('gameOver'), 3000)
      return () => clearTimeout(t)
    }

    // 2.5 seconds — enough time to actually read the result
    if (iShouldFireNextRound) {
      const t = setTimeout(advance, 2500)
      return () => clearTimeout(t)
    }
  }, [isGameOver, iShouldFireNextRound])

  // Visual config depending on outcome
  let bannerEmoji = '😅'
  let bannerTitle = 'Nobody got it'
  let bannerSub = 'Better luck next round'
  let bannerColor = '#c9a4b5'
  let bannerBg = 'rgba(201,164,181,0.15)'
  let bannerBorder = 'rgba(201,164,181,0.5)'

  if (found && iWasGuesser) {
    bannerEmoji = '🏆'
    bannerTitle = 'You got it!'
    bannerSub = `+${points} point${points === 1 ? '' : 's'} for you`
    bannerColor = '#4dff88'
    bannerBg = 'rgba(77,255,136,0.15)'
    bannerBorder = 'rgba(77,255,136,0.5)'
  } else if (found && !iWasGuesser) {
    bannerEmoji = '💕'
    bannerTitle = 'She got it!'
    bannerSub = `+${points} point${points === 1 ? '' : 's'} for Minatallah`
    bannerColor = '#ff9ec7'
    bannerBg = 'rgba(255,158,199,0.15)'
    bannerBorder = 'rgba(255,158,199,0.5)'
  } else if (!found) {
    bannerEmoji = '😅'
    bannerTitle = 'Nobody got it'
    bannerSub = 'No points this round'
    bannerColor = '#ff994d'
    bannerBg = 'rgba(255,153,77,0.15)'
    bannerBorder = 'rgba(255,153,77,0.5)'
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-24 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md"
      >
        {/* Big outcome banner — cannot be missed */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          className="rounded-3xl p-6 mb-6 border-2"
          style={{
            background: bannerBg,
            borderColor: bannerBorder,
          }}
        >
          <div className="text-7xl mb-2">{bannerEmoji}</div>
          <h1
            className="font-display text-4xl mb-2"
            style={{ color: bannerColor }}
          >
            {bannerTitle}
          </h1>
          <p className="text-sm font-semibold" style={{ color: bannerColor }}>
            {bannerSub}
          </p>

          {/* Reveal the secret number */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="text-[10px] text-rose-soft/60 uppercase tracking-widest mb-1">
              The number was
            </div>
            <div className="text-4xl font-black text-rose-glow">
              {realSecret}
            </div>
          </div>
        </motion.div>

        {/* Funny line */}
        <p className="font-display text-xl text-rose-soft italic mb-6">
          "{funnyLine}"
        </p>

        {/* Running total */}
        <div className="bg-white/5 rounded-2xl p-5 mb-6 border border-rose-glow/30">
          <div className="text-[10px] text-rose-soft/60 uppercase tracking-widest mb-3">
            Running Total
          </div>
          <div className="flex justify-around items-center">
            <div>
              <div className="text-rose-soft/60 text-xs">You</div>
              <div className="text-3xl font-black text-rose-soft">{myScore}</div>
            </div>
            <div className="text-rose-glow text-2xl">vs</div>
            <div>
              <div className="text-rose-soft/60 text-xs">Minatallah</div>
              <div className="text-3xl font-black text-rose-soft">{herScore}</div>
            </div>
          </div>
        </div>

        {/* Auto-advance message */}
        {!isGameOver && (
          <p className="text-rose-soft/40 text-xs">
            Round {roundNumber + 1} of 20 starting...
          </p>
        )}

        {isGameOver && (
          <p className="text-rose-glow text-sm animate-pulse">
            Final results coming... 💘
          </p>
        )}

        {/* Progress bar — shows how long until next round */}
        {!isGameOver && (
          <div className="mt-4 h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.5, ease: 'linear' }}
              className="h-full bg-gradient-to-r from-rose-glow to-pink-500"
            />
          </div>
        )}
      </motion.div>
    </div>
  )
}