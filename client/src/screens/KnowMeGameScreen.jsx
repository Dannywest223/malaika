import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { socket } from '../socket'

export default function KnowMeGameScreen({ game, myId, round: initialRound, setScreen }) {
  const [round, setRound] = useState(initialRound)
  const [answers, setAnswers] = useState(['', '', ''])
  const [guesses, setGuesses] = useState(['', '', ''])
  const [result, setResult] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [tappedContinue, setTappedContinue] = useState(false)

  const isSubject = round?.subject_id === myId
  const myScore = myId === game.player1_id ? game.player1_score : game.player2_score
  const herScore = myId === game.player1_id ? game.player2_score : game.player1_score

  useEffect(() => {
    const onRoundStart = (r) => {
      setRound(r)
      setAnswers(['', '', ''])
      setGuesses(['', '', ''])
      setResult(null)
      setSubmitted(false)
      setTappedContinue(false)
    }
    const onAnswersSubmitted = (r) => {
      setRound(r)
    }
    const onRoundEnd = (res) => {
      setResult(res)
      setRound(res.round)
    }
    socket.on('knowme_round_started', onRoundStart)
    socket.on('knowme_answers_submitted', onAnswersSubmitted)
    socket.on('knowme_round_ended', onRoundEnd)
    return () => {
      socket.off('knowme_round_started', onRoundStart)
      socket.off('knowme_answers_submitted', onAnswersSubmitted)
      socket.off('knowme_round_ended', onRoundEnd)
    }
  }, [])

  // Fallback: if the round never arrives, ask the server for it
  useEffect(() => {
    if (round) return
    const t = setTimeout(() => {
      console.log('⏰ Know Me round missing, requesting...')
      socket.emit('knowme_request_current_round', { gameId: game.id })
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

  const submitAnswers = () => {
    if (!round) return
    if (answers.some((a) => !a.trim())) return
    socket.emit('knowme_submit_answers', { roundId: round.id, answers })
    setSubmitted(true)
  }

  const submitGuesses = () => {
    if (!round) return
    if (guesses.some((g) => !g.trim())) return
    socket.emit('knowme_submit_guesses', { roundId: round.id, guesses })
    setSubmitted(true)
  }

  const handleContinue = () => {
    if (tappedContinue) return
    setTappedContinue(true)
    socket.emit('knowme_next_round', {
      gameId: game.id,
      roundId: result.round.id,
    })
  }

  // ---- Result screen ----
  if (result) {
    const r = result.round
    const correct = result.correct
    const isGuesser = result.guesserId === myId

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="text-6xl mb-3">
            {correct === 3 ? '🏆' : correct >= 1 ? '👏' : '💔'}
          </div>
          <h1 className="font-display text-4xl text-rose-soft mb-2">
            {correct}/3 correct
          </h1>
          <p className="text-rose-soft/70 text-sm mb-2">
            {isGuesser
              ? `+${result.points} points for you`
              : `${result.points} points for Minatallah`}
          </p>
          {result.roast && (
            <p className="font-display italic text-lg text-rose-soft mb-6">
              "{result.roast}"
            </p>
          )}

          <div className="space-y-3 mb-6">
            {[0, 1, 2].map((i) => {
              const q = r[`question_${i + 1}`]
              const a = r[`answer_${i + 1}`]
              const g = r[`guess_${i + 1}`]
              const isCorrect =
                (a || '').toLowerCase().trim() === (g || '').toLowerCase().trim()
              return (
                <div
                  key={i}
                  className={`rounded-2xl p-4 text-left border-2 ${
                    isCorrect
                      ? 'bg-green-500/10 border-green-400/50'
                      : 'bg-red-500/10 border-red-400/50'
                  }`}
                >
                  <div className="text-[10px] text-rose-soft/60 uppercase tracking-widest mb-1">
                    {q}
                  </div>
                  <div className="text-sm">
                    <span className="text-rose-soft/60">Real answer: </span>
                    <span className="text-rose-soft font-bold">{a}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-rose-soft/60">Guess: </span>
                    <span
                      className={
                        isCorrect
                          ? 'text-green-400 font-bold'
                          : 'text-red-400 font-bold'
                      }
                    >
                      {g} {isCorrect ? '✅' : '❌'}
                    </span>
                  </div>
                </div>
              )
            })}
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
            Round {round.round_number} of 20
          </p>
        </motion.div>
      </div>
    )
  }

  // ---- Loading state ----
  if (!round) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-24 text-center">
        <div className="text-7xl mb-4 animate-pulse">🧠</div>
        <h2 className="font-display text-2xl text-rose-soft mb-2">
          Loading round...
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

  // ---- Subject answering phase ----
  if (isSubject && round.status === 'answering') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-6">
            <div className="text-5xl mb-2">✍️</div>
            <h2 className="font-display text-3xl text-rose-soft mb-1">
              Answer about yourself
            </h2>
            <p className="text-rose-soft/60 text-xs">
              Minatallah will try to guess your answers
            </p>
          </div>

          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i}>
                <div className="text-rose-soft/70 text-xs mb-1 font-semibold">
                  {round[`question_${i + 1}`]}
                </div>
                <input
                  value={answers[i]}
                  onChange={(e) => {
                    const copy = [...answers]
                    copy[i] = e.target.value
                    setAnswers(copy)
                  }}
                  placeholder="Your answer..."
                  disabled={submitted}
                  className="w-full py-3 px-4 rounded-2xl bg-white/5 border border-rose-glow/40 text-white placeholder-rose-soft/30 outline-none focus:border-rose-glow transition"
                />
              </div>
            ))}
          </div>

          <button
            onClick={submitAnswers}
            disabled={answers.some((a) => !a.trim()) || submitted}
            className="mt-6 w-full py-4 rounded-2xl bg-gradient-to-r from-rose-glow to-pink-600 text-white font-bold text-xl shadow-glow disabled:opacity-40 active:scale-95 transition"
          >
            {submitted ? 'Waiting for her to guess...' : 'Lock answers 🔒'}
          </button>
        </motion.div>
      </div>
    )
  }

  // ---- Guesser guessing phase ----
  if (!isSubject && round.status === 'guessing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-6">
            <div className="text-5xl mb-2">🧠</div>
            <h2 className="font-display text-3xl text-rose-soft mb-1">
              Guess the answers
            </h2>
            <p className="text-rose-soft/60 text-xs">
              Try to match what Minatallah said about herself
            </p>
          </div>

          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i}>
                <div className="text-rose-soft/70 text-xs mb-1 font-semibold">
                  {round[`question_${i + 1}`]}
                </div>
                <input
                  value={guesses[i]}
                  onChange={(e) => {
                    const copy = [...guesses]
                    copy[i] = e.target.value
                    setGuesses(copy)
                  }}
                  placeholder="Your guess..."
                  disabled={submitted}
                  className="w-full py-3 px-4 rounded-2xl bg-white/5 border border-rose-glow/40 text-white placeholder-rose-soft/30 outline-none focus:border-rose-glow transition"
                />
              </div>
            ))}
          </div>

          <button
            onClick={submitGuesses}
            disabled={guesses.some((g) => !g.trim()) || submitted}
            className="mt-6 w-full py-4 rounded-2xl bg-gradient-to-r from-rose-glow to-pink-600 text-white font-bold text-xl shadow-glow disabled:opacity-40 active:scale-95 transition"
          >
            {submitted ? 'Checking answers...' : 'Submit guesses 💘'}
          </button>
        </motion.div>
      </div>
    )
  }

  // ---- Waiting screen ----
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-24 text-center">
      <div className="text-7xl mb-4 animate-pulse">⏳</div>
      <h2 className="font-display text-2xl text-rose-soft mb-2">
        {isSubject ? 'Waiting for guesses...' : 'Waiting for answers...'}
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