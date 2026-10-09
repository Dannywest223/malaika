import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { socket } from '../socket'

export default function WYRGameScreen({ game, myId, round: initialRound, setScreen }) {
  const [round, setRound] = useState(initialRound)
  const [myChoice, setMyChoice] = useState(null)
  const [result, setResult] = useState(null)
  const [tappedContinue, setTappedContinue] = useState(false)

  const myScore = myId === game.player1_id ? game.player1_score : game.player2_score
  const herScore = myId === game.player1_id ? game.player2_score : game.player1_score

  useEffect(() => {
    const onRoundStart = (r) => {
      setRound(r)
      setMyChoice(null)
      setResult(null)
      setTappedContinue(false)
    }
    const onRoundEnd = (res) => {
      setResult(res)
      setRound(res.round)
    }
    socket.on('wyr_round_started', onRoundStart)
    socket.on('wyr_round_ended', onRoundEnd)
    return () => {
      socket.off('wyr_round_started', onRoundStart)
      socket.off('wyr_round_ended', onRoundEnd)
    }
  }, [])

  // Fallback: if the round never arrives, ask the server for it
  useEffect(() => {
    if (round) return
    const t = setTimeout(() => {
      console.log('⏰ WYR round missing, requesting...')
      socket.emit('wyr_request_current_round', { gameId: game.id })
    }, 2500)
    return () => clearTimeout(t)
  }, [round, game.id])

  // Listen for partner tapping continue
  useEffect(() => {
    const onPartnerTapped = () => {
      console.log('👀 Partner tapped continue')
    }
    socket.on('partner_tapped_continue', onPartnerTapped)
    return () => socket.off('partner_tapped_continue', onPartnerTapped)
  }, [])

  const choose = (choice) => {
    if (!round) return
    if (myChoice || result) return
    setMyChoice(choice)
    socket.emit('wyr_submit_choice', { roundId: round.id, choice })
  }

  const handleContinue = () => {
    if (tappedContinue) return
    setTappedContinue(true)
    socket.emit('wyr_next_round', {
      gameId: game.id,
      roundId: result.round.id,
    })
  }

  // ---- Result screen ----
  if (result) {
    const p1Choice = result.round.player1_choice
    const p2Choice = result.round.player2_choice
    const matched = result.matched

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10 }}
            className="text-7xl mb-4"
          >
            {matched ? '💕' : '🤔'}
          </motion.div>

          <h1
            className="font-display text-4xl mb-2"
            style={{ color: matched ? '#4dff88' : '#ff9ec7' }}
          >
            {matched ? 'You matched!' : 'Different choices'}
          </h1>
          <p className="text-rose-soft/70 text-sm mb-2">
            {matched ? '+5 points for both 💕' : 'No points this round'}
          </p>
          {result.roast && (
            <p className="font-display italic text-lg text-rose-soft mb-6">
              "{result.roast}"
            </p>
          )}

          <div className="space-y-3 mb-6">
            <div className="bg-white/5 border-2 border-rose-glow/40 rounded-2xl p-4 text-left">
              <div className="text-[10px] text-rose-soft/60 uppercase tracking-widest mb-1">
                Your pick
              </div>
              <div className="text-rose-soft font-bold">
                {myId === game.player1_id
                  ? p1Choice === 'a'
                    ? round.option_a
                    : round.option_b
                  : p2Choice === 'a'
                  ? round.option_a
                  : round.option_b}
              </div>
            </div>
            <div className="bg-white/5 border-2 border-rose-glow/40 rounded-2xl p-4 text-left">
              <div className="text-[10px] text-rose-soft/60 uppercase tracking-widest mb-1">
                Their pick
              </div>
              <div className="text-rose-soft font-bold">
                {myId === game.player1_id
                  ? p2Choice === 'a'
                    ? round.option_a
                    : round.option_b
                  : p1Choice === 'a'
                  ? round.option_a
                  : round.option_b}
              </div>
            </div>
          </div>

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

          {/* CONTINUE BUTTON */}
          {!result.isGameOver ? (
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
  Round {result.finishedRounds || 1} of {result.totalRounds || 20}
</p>
        </motion.div>
      </div>
    )
  }

  // ---- Loading state ----
  if (!round) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-24 text-center">
        <div className="text-7xl mb-4 animate-pulse">💕</div>
        <h2 className="font-display text-2xl text-rose-soft mb-2">
          Loading question...
        </h2>
        <div className="flex justify-center gap-1 mt-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              className="w-2 h-2 rounded-full bg-rose-glow"
            />
          ))}
        </div>
      </div>
    )
  }

  // ---- Picking phase ----
  const iHaveChosen = myChoice !== null

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">💕</div>
          <h2 className="font-display text-3xl text-rose-soft mb-1">
            Would you rather...
          </h2>
          <p className="text-rose-soft/60 text-xs">
            Pick one secretly — see if you match
          </p>
        </div>

        <div className="space-y-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => choose('a')}
            disabled={iHaveChosen}
            className={`w-full p-5 rounded-3xl border-2 transition text-left ${
              myChoice === 'a'
                ? 'bg-rose-glow text-white border-rose-glow shadow-glow'
                : 'bg-white/5 border-rose-glow/40 text-rose-soft hover:bg-rose-glow/20'
            } ${iHaveChosen && myChoice !== 'a' ? 'opacity-40' : ''}`}
          >
            <div className="text-[10px] uppercase tracking-widest mb-1 opacity-70">
              Option A
            </div>
            <div className="text-lg font-bold">{round.option_a}</div>
          </motion.button>

          <div className="text-center text-rose-soft/40 text-sm">or</div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => choose('b')}
            disabled={iHaveChosen}
            className={`w-full p-5 rounded-3xl border-2 transition text-left ${
              myChoice === 'b'
                ? 'bg-rose-glow text-white border-rose-glow shadow-glow'
                : 'bg-white/5 border-rose-glow/40 text-rose-soft hover:bg-rose-glow/20'
            } ${iHaveChosen && myChoice !== 'b' ? 'opacity-40' : ''}`}
          >
            <div className="text-[10px] uppercase tracking-widest mb-1 opacity-70">
              Option B
            </div>
            <div className="text-lg font-bold">{round.option_b}</div>
          </motion.button>
        </div>

        {iHaveChosen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-center"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-rose-soft/60 text-sm">
                Waiting for her to pick
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
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}