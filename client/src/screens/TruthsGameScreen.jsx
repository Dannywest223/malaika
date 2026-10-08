import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { socket } from '../socket'

const STARTER_PROMPTS = [
  'A weird talent I have...',
  'Something embarrassing that happened to me...',
  'A food I pretend to like...',
  'Something I never told anyone...',
  'A place I want to visit...',
  'My worst habit...',
  'Something I am weirdly good at...',
  'Something I regret...',
  'A moment that changed me...',
  'A thing I would do if I won the lottery...',
]

const REACTIONS = ['😂', '💀', '😱', '🥰', '🎯', '😭']

export default function TruthsGameScreen({ game, myId, round: initialRound, setScreen }) {
  const [round, setRound] = useState(initialRound)
  const [statements, setStatements] = useState(['', '', ''])
  const [lieIndex, setLieIndex] = useState(null)
  const [result, setResult] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [pickedIndex, setPickedIndex] = useState(null)
  const [prompt, setPrompt] = useState(
    STARTER_PROMPTS[Math.floor(Math.random() * STARTER_PROMPTS.length)]
  )
  const [floatingReactions, setFloatingReactions] = useState([])

  const isWriter = round?.writer_id === myId
  const myScore = myId === game.player1_id ? game.player1_score : game.player2_score
  const herScore = myId === game.player1_id ? game.player2_score : game.player1_score

  useEffect(() => {
    const onRoundStart = (r) => {
      setRound(r)
      setStatements(['', '', ''])
      setLieIndex(null)
      setResult(null)
      setSubmitted(false)
      setPickedIndex(null)
      setFloatingReactions([])
      setPrompt(
        STARTER_PROMPTS[Math.floor(Math.random() * STARTER_PROMPTS.length)]
      )
    }
    const onStatementsSubmitted = (r) => setRound(r)
    const onRoundEnd = (res) => {
      setResult(res)
      setRound(res.round)
    }
    const onReaction = ({ emoji, senderId }) => {
      if (senderId === myId) return
      const id = Date.now() + Math.random()
      const left = 10 + Math.random() * 80
      setFloatingReactions((prev) => [...prev, { id, emoji, left }])
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== id))
      }, 3000)
    }

    socket.on('truths_round_started', onRoundStart)
    socket.on('truths_statements_submitted', onStatementsSubmitted)
    socket.on('truths_round_ended', onRoundEnd)
    socket.on('truths_reaction', onReaction)

    return () => {
      socket.off('truths_round_started', onRoundStart)
      socket.off('truths_statements_submitted', onStatementsSubmitted)
      socket.off('truths_round_ended', onRoundEnd)
      socket.off('truths_reaction', onReaction)
    }
  }, [])

  useEffect(() => {
    if (!result) return
    if (result.isGameOver) {
      const t = setTimeout(() => setScreen('gameOver'), 5500)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => {
      socket.emit('truths_next_round', { gameId: game.id })
    }, 5500)
    return () => clearTimeout(t)
  }, [result])

  const submitStatements = () => {
    if (statements.some((s) => !s.trim())) return
    if (lieIndex === null) return
    socket.emit('truths_submit_statements', {
      roundId: round.id,
      statements,
      lieIndex,
    })
    setSubmitted(true)
  }

  const submitGuess = (idx) => {
    if (pickedIndex !== null || result) return
    setPickedIndex(idx)
    socket.emit('truths_submit_guess', { roundId: round.id, pickIndex: idx })
  }

  const sendReaction = (emoji) => {
    socket.emit('truths_reaction', { gameId: game.id, emoji })
    const id = Date.now() + Math.random()
    const left = 10 + Math.random() * 80
    setFloatingReactions((prev) => [...prev, { id, emoji, left }])
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id))
    }, 3000)
  }

  // ---- Result screen ----
  if (result) {
    const r = result.round
    const correct = result.correct
    const isGuesser = result.guesserId === myId
    const allStatements = [r.statement_1, r.statement_2, r.statement_3]

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-24 text-center relative overflow-hidden">
        {/* Floating reactions */}
        <div className="fixed inset-0 pointer-events-none z-40">
          <AnimatePresence>
            {floatingReactions.map((fr) => (
              <motion.div
                key={fr.id}
                initial={{ y: 0, opacity: 0, scale: 0.5 }}
                animate={{ y: -400, opacity: [0, 1, 1, 0], scale: 1.5, rotate: Math.random() * 40 - 20 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 3 }}
                className="absolute bottom-20 text-5xl"
                style={{ left: `${fr.left}%` }}
              >
                {fr.emoji}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <motion.div
          animate={!correct ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md relative z-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10 }}
            className="text-7xl mb-3"
          >
            {correct ? '🎉' : '💔'}
          </motion.div>

          <h1
            className="font-display text-4xl mb-2"
            style={{ color: correct ? '#4dff88' : '#ff9ec7' }}
          >
            {correct ? 'You got it!' : 'Wrong guess'}
          </h1>
          <p className="text-rose-soft/70 text-sm mb-2">
            {isGuesser
              ? `+${result.points} points for you`
              : `+${result.points} points for Minatallah`}
          </p>
          <p className="font-display italic text-lg text-rose-soft mb-6">
            "{result.roast}"
          </p>

          <div className="space-y-3 mb-6">
            {allStatements.map((s, i) => {
              const isLie = i === r.lie_index
              const wasPicked = i === r.guesser_pick
              return (
                <div
                  key={i}
                  className={`rounded-2xl p-4 text-left border-2 ${
                    isLie
                      ? 'bg-red-500/10 border-red-400/50'
                      : 'bg-green-500/10 border-green-400/50'
                  }`}
                >
                  <div className="text-sm text-rose-soft">{s}</div>
                  <div className="text-[10px] mt-2 uppercase tracking-widest flex items-center justify-between">
                    <span>
                      {isLie ? (
                        <span className="text-red-400">💥 The lie</span>
                      ) : (
                        <span className="text-green-400">✅ True</span>
                      )}
                    </span>
                    {wasPicked && (
                      <span className="text-rose-glow text-[10px]">
                        you picked this
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="bg-white/5 rounded-2xl p-5 mb-4 border border-rose-glow/30">
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

          {/* Reactions */}
          <div className="bg-white/5 border border-rose-glow/30 rounded-2xl p-3 mb-4">
            <div className="text-[10px] text-rose-soft/60 uppercase tracking-widest mb-2">
              React
            </div>
            <div className="flex justify-center gap-2">
              {REACTIONS.map((emoji) => (
                <motion.button
                  key={emoji}
                  whileTap={{ scale: 0.8 }}
                  onClick={() => sendReaction(emoji)}
                  className="w-12 h-12 rounded-full bg-white/5 border border-rose-glow/30 text-2xl hover:bg-rose-glow/20 transition"
                >
                  {emoji}
                </motion.button>
              ))}
            </div>
          </div>

          <p className="text-rose-soft/40 text-xs">
            {result.isGameOver
              ? 'Final results coming...'
              : `Round ${round.round_number + 1} starting...`}
          </p>

          {/* Progress bar */}
          {!result.isGameOver && (
            <div className="mt-4 h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 5.5, ease: 'linear' }}
                className="h-full bg-gradient-to-r from-rose-glow to-pink-500"
              />
            </div>
          )}
        </motion.div>
      </div>
    )
  }

  // ---- Writer phase ----
  if (isWriter && round.status === 'writing') {
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
              Write 3 things
            </h2>
            <p className="text-rose-soft/60 text-xs">
              2 truths + 1 lie. She'll try to spot the lie.
            </p>
          </div>

          <div className="space-y-3 mb-4">
            {[0, 1, 2].map((i) => (
              <div key={i}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-rose-soft/70 text-xs font-semibold">
                    Statement {i + 1}
                  </span>
                  {lieIndex === i && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/30 text-red-300 uppercase tracking-wider">
                      this is the lie
                    </span>
                  )}
                </div>
                <input
                  value={statements[i]}
                  onChange={(e) => {
                    const copy = [...statements]
                    copy[i] = e.target.value
                    setStatements(copy)
                  }}
                  placeholder={i === 0 ? prompt : 'Another statement...'}
                  disabled={submitted}
                  className="w-full py-3 px-4 rounded-2xl bg-white/5 border border-rose-glow/40 text-white placeholder-rose-soft/30 outline-none focus:border-rose-glow transition"
                />
              </div>
            ))}
          </div>

          <div className="bg-white/5 border border-rose-glow/30 rounded-2xl p-4 mb-4">
            <div className="text-xs text-rose-soft/70 mb-2 text-center">
              Which one is the lie?
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => (
                <button
                  key={i}
                  onClick={() => setLieIndex(i)}
                  disabled={submitted}
                  className={`py-3 rounded-xl font-bold text-lg transition ${
                    lieIndex === i
                      ? 'bg-rose-glow text-white shadow-glow'
                      : 'bg-white/5 text-rose-soft/70 border border-rose-glow/30 hover:bg-white/10'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={submitStatements}
            disabled={
              statements.some((s) => !s.trim()) || lieIndex === null || submitted
            }
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-glow to-pink-600 text-white font-bold text-xl shadow-glow disabled:opacity-40 active:scale-95 transition"
          >
            {submitted ? 'Waiting for her to guess...' : 'Lock it in 🔒'}
          </button>

          <button
            onClick={() =>
              setPrompt(
                STARTER_PROMPTS[
                  Math.floor(Math.random() * STARTER_PROMPTS.length)
                ]
              )
            }
            disabled={submitted}
            className="mt-3 w-full py-2 rounded-2xl bg-white/5 border border-rose-glow/20 text-rose-soft/60 text-xs hover:bg-white/10 transition"
          >
            🎲 New prompt idea
          </button>
        </motion.div>
      </div>
    )
  }

  // ---- Guesser phase ----
  if (!isWriter && round.status === 'guessing') {
    const allStatements = [round.statement_1, round.statement_2, round.statement_3]
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-6">
            <div className="text-5xl mb-2">🕵️</div>
            <h2 className="font-display text-3xl text-rose-soft mb-1">
              Which one is the lie?
            </h2>
            <p className="text-rose-soft/60 text-xs">
              2 are true. 1 is fake. Tap the fake one.
            </p>
          </div>

          <div className="space-y-3">
            {allStatements.map((s, i) => {
              const isPicked = pickedIndex === i
              return (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => submitGuess(i)}
                  disabled={pickedIndex !== null}
                  className={`w-full p-5 rounded-3xl border-2 text-left transition ${
                    isPicked
                      ? 'bg-rose-glow text-white border-rose-glow shadow-glow'
                      : 'bg-white/5 border-rose-glow/40 text-rose-soft hover:bg-rose-glow/20'
                  } ${pickedIndex !== null && !isPicked ? 'opacity-40' : ''}`}
                >
                  <div className="text-[10px] uppercase tracking-widest mb-1 opacity-70">
                    Statement {i + 1}
                  </div>
                  <div className="text-base font-semibold">{s}</div>
                </motion.button>
              )
            })}
          </div>

          {pickedIndex !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 text-center"
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-rose-soft/60 text-sm">Revealing...</span>
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
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

  // ---- Waiting screen ----
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-24 text-center">
      <div className="text-7xl mb-4 animate-pulse">⏳</div>
      <h2 className="font-display text-2xl text-rose-soft mb-2">
        {isWriter ? 'Waiting for her to guess...' : 'Waiting for statements...'}
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