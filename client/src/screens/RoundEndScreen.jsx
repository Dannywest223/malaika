import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { socket } from '../socket'

export default function RoundEndScreen({ round, game, myId, setScreen, roundResult }) {
  const [tappedContinue, setTappedContinue] = useState(false)

  const isGameOver = roundResult?.isGameOver
  const guesserId = roundResult?.guesserId
  const found = roundResult?.found
  const points = roundResult?.points || 0

  const iWasGuesser = guesserId === myId
  const roundNumber = round.round_number

  const myScore = myId === game.player1_id ? game.player1_score : game.player2_score
  const herScore = myId === game.player1_id ? game.player2_score : game.player1_score

  const realSecret =
    roundNumber % 2 === 1 ? round.player1_secret : round.player2_secret

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

  // Listen for partner tapping continue
  useEffect(() => {
    const onPartnerTapped = () => {
      console.log('👀 Partner tapped continue')
    }
    socket.on('partner_tapped_continue', onPartnerTapped)
    return () => socket.off('partner_tapped_continue', onPartnerTapped)
  }, [])

  const handleContinue = () => {
    if (tappedContinue) return
    setTappedContinue(true)
    socket.emit('next_round', {
      gameId: game.id,
      roundId: round.id,
    })
  }

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

          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="text-[10px] text-rose-soft/60 uppercase tracking-widest mb-1">
              The number was
            </div>
            <div className="text-4xl font-black text-rose-glow">
              {realSecret}
            </div>
          </div>
        </motion.div>

        <p className="font-display text-xl text-rose-soft italic mb-6">
          "{funnyLine}"
        </p>

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

        {!isGameOver ? (
          <div>
            {!tappedContinue ? (
              <button
                onClick={handleContinue}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-glow to-pink-600 text-white font-bold text-xl shadow-glow hover:scale-[1.02] active:scale-95 transition"
              >
                Continue ➡️
              </button>
            ) : (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-rose-soft/60 text-sm">
                    Waiting for her to continue
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
                  She needs to tap Continue too
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setScreen('gameOver')}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-glow to-pink-600 text-white font-bold text-xl shadow-glow hover:scale-[1.02] active:scale-95 transition"
          >
            See Final Results 🏆
          </button>
        )}

        <p className="text-rose-soft/40 text-xs mt-3">
          Round {roundNumber} of 20
        </p>
      </motion.div>
    </div>
  )
}