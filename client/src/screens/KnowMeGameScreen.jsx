import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { socket } from '../socket'

export default function NumberGameScreen({ game, myId, round: initialRound, setScreen }) {
  const [round, setRound] = useState(initialRound)
  const [myPick, setMyPick] = useState(null)
  const [result, setResult] = useState(null)
  const [tappedContinue, setTappedContinue] = useState(false)

  const myScore = myId === game.player1_id ? game.player1_score : game.player2_score
  const herScore = myId === game.player1_id ? game.player2_score : game.player1_score

  useEffect(() => {
    const onRoundStart = (r) => {
      setRound(r)
      setMyPick(null)
      setResult(null)
      setTappedContinue(false)
    }
    const onRoundEnd = (res) => {
      setResult(res)
      setRound(res.round)
    }
    socket.on('num_round_started', onRoundStart)
    socket.on('num_round_ended', onRoundEnd)
    return () => {
      socket.off('num_round_started', onRoundStart)
      socket.off('num_round_ended', onRoundEnd)
    }
  }, [])

  useEffect(() => {
    if (round) return
    const t = setTimeout(() => {
      socket.emit('num_request_current_round', { gameId: game.id })
    }, 2500)
    return () => clearTimeout(t)
  }, [round, game.id])

  useEffect(() => {
    const onPartnerTapped = () => {}
    socket.on('partner_tapped_continue', onPartnerTapped)
    return () => socket.off('partner_tapped_continue', onPartnerTapped)
  }, [])

  const choose = (num) => {
    if (!round) return
    if (myPick !== null || result) return
    setMyPick(num)
    socket.emit('num_submit_pick', { roundId: round.id, pick: num })
  }

  const handleContinue = () => {
    if (tappedContinue) return
    setTappedContinue(true)
    socket.emit('num_next_round', {
      gameId: game.id,
      roundId: result.round.id,
    })
  }

  // ---- Result screen ----
  if (result) {
    const p1 = result.round.player1_pick
    const p2 = result.round.player2_pick
    const matched = result.matched
    const target = result.round.target

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
            {matched ? '🎯' : '😅'}
          </motion.div>

          <h1
            className="font-display text-4xl mb-2"
            style={{ color: matched ? '#4dff88' : '#ff9ec7' }}
          >
            {matched ? 'You matched!' : 'Not quite'}
          </h1>
          <p className="text-rose-soft/70 text-sm mb-2">
            {matched ? '+1 point for both 💕' : 'No points this round'}
          </p>
          {result.roast && (
            <p className="font-display italic text-lg text-rose-soft mb-6">
              "{result.roast}"
            </p>
          )}

          <div className="bg-white/5 border-2 border-rose-glow/40 rounded-2xl p-5 mb-6">
            <div className="text-[10px] text-rose-soft/60 uppercase tracking-widest mb-3">
              The math
            </div>
            <div className="flex justify-center items-center gap-3 text-2xl">
              <div>
                <div className="text-[10px] text-rose-soft/60 mb-1">You</div>
                <div className="font-black text-rose-glow">
                  {myId === game.player1_id ? p1 : p2}
                </div>
              </div>
              <div className="text-rose-soft text-xl">+</div>
              <div>
                <div className="text-[10px] text-rose-soft/60 mb-1">Her</div>
                <div className="font-black text-rose-glow">
                  {myId === game.player1_id ? p2 : p1}
                </div>
              </div>
              <div className="text-rose-soft text-xl">=</div>
              <div>
                <div className="text-[10px] text-rose-soft/60 mb-1">Sum</div>
                <div
                  className="font-black"
                  style={{ color: matched ? '#4dff88' : '#ff4d6d' }}
                >
                  {result.sum}
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="text-[10px] text-rose-soft/60 uppercase tracking-widest mb-1">
                Target was
              </div>
              <div className="text-3xl font-black text-rose-glow">{target}</div>
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

  // ---- Loading ----
  if (!round) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-24 text-center">
        <div className="text-7xl mb-4 animate-pulse">🎯</div>
        <h2 className="font-display text-2xl text-rose-soft">
          Loading round...
        </h2>
      </div>
    )
  }

  // ---- Picking phase ----
  const iHavePicked = myPick !== null

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🎯</div>
          <h2 className="font-display text-3xl text-rose-soft mb-1">
            Pick a number
          </h2>
          <p className="text-rose-soft/60 text-xs">
            1 to 15. Together you must sum to...
          </p>
        </div>

        {/* Target */}
        <div className="bg-gradient-to-br from-rose-glow/20 to-purple-500/10 border-2 border-rose-glow/40 rounded-3xl p-6 mb-6 text-center">
          <div className="text-[10px] text-rose-soft/60 uppercase tracking-widest mb-2">
            Target
          </div>
          <div className="text-6xl font-black text-rose-glow">
            {round.target}
          </div>
        </div>

        {/* Number grid 1-15 */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((num) => {
            const isPicked = myPick === num
            return (
              <motion.button
                key={num}
                whileTap={{ scale: 0.9 }}
                onClick={() => choose(num)}
                disabled={iHavePicked}
                className={`py-3 rounded-2xl font-black text-lg transition ${
                  isPicked
                    ? 'bg-rose-glow text-white shadow-glow'
                    : 'bg-white/5 border border-rose-glow/40 text-rose-soft hover:bg-rose-glow/20'
                } ${iHavePicked && !isPicked ? 'opacity-30' : ''}`}
              >
                {num}
              </motion.button>
            )
          })}
        </div>

        {iHavePicked && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="bg-white/5 border border-rose-glow/30 rounded-2xl p-4 mb-3">
              <div className="text-[10px] text-rose-soft/60 uppercase tracking-widest mb-1">
                You picked
              </div>
              <div className="text-4xl font-black text-rose-glow">
                {myPick}
              </div>
            </div>
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