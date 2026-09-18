import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { socket } from '../socket'

const MAX_GUESSES = 3

export default function GuessScreen({ round, myId, game }) {
  const [guess, setGuess] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [lastGuess, setLastGuess] = useState(null)
  const [guessesLeft, setGuessesLeft] = useState(MAX_GUESSES)
  const [myHistory, setMyHistory] = useState([])
  const [options, setOptions] = useState(null)
  const [pickedOption, setPickedOption] = useState(null)

  // Range hint — starts at 1-100 and narrows with each wrong guess
  const [rangeLow, setRangeLow] = useState(1)
  const [rangeHigh, setRangeHigh] = useState(100)

  const roundNumber = round.round_number
  const pickerId = roundNumber % 2 === 1 ? game.player1_id : game.player2_id
  const guesserId = roundNumber % 2 === 1 ? game.player2_id : game.player1_id

  const iAmGuesser = myId === guesserId

  useEffect(() => {
    setFeedback(null)
    setGuess('')
    setLastGuess(null)
    setGuessesLeft(MAX_GUESSES)
    setMyHistory([])
    setOptions(null)
    setPickedOption(null)
    setRangeLow(1)
    setRangeHigh(100)

    if (iAmGuesser) {
      const used =
        myId === game.player1_id
          ? round.player1_guesses_used
          : round.player2_guesses_used
      setGuessesLeft(MAX_GUESSES - used)
    }
  }, [round.id])

  useEffect(() => {
    const handler = ({
      feedback,
      guess: guessedValue,
      guessesLeft: left,
      options: opts,
    }) => {
      setFeedback(feedback)
      setLastGuess(guessedValue)
      if (typeof left === 'number') setGuessesLeft(left)
      setMyHistory((prev) => [...prev, { value: guessedValue, feedback }])

      // Narrow the visible range
      if (feedback === 'higher') {
        setRangeLow((prev) => Math.max(prev, guessedValue + 1))
      } else if (feedback === 'lower') {
        setRangeHigh((prev) => Math.min(prev, guessedValue - 1))
      }

      // 3-option hint arrives only after 2nd wrong guess
      if (opts && opts.length === 3) {
        setOptions(opts)
      }
    }
    socket.on('guess_feedback', handler)
    return () => socket.off('guess_feedback', handler)
  }, [])

  const submit = () => {
    const value = parseInt(guess)
    if (!value || value < 1 || value > 100) return
    if (guessesLeft <= 0) return
    socket.emit('submit_guess', { roundId: round.id, guess: value })
    setGuess('')
  }

  const submitOption = (value) => {
    if (guessesLeft <= 0) return
    if (pickedOption !== null) return
    setPickedOption(value)
    socket.emit('submit_guess', { roundId: round.id, guess: value })
  }

  const feedbackConfig = {
    higher: {
      emoji: '⬆️',
      title: 'HIGHER!',
      sub: 'The number is bigger than that',
      color: '#4da6ff',
      bg: 'rgba(77,166,255,0.15)',
      border: '#4da6ff',
    },
    lower: {
      emoji: '⬇️',
      title: 'LOWER!',
      sub: 'The number is smaller than that',
      color: '#ff994d',
      bg: 'rgba(255,153,77,0.15)',
      border: '#ff994d',
    },
    correct: {
      emoji: '🎉',
      title: 'CORRECT!',
      sub: 'You got it!',
      color: '#4dff88',
      bg: 'rgba(77,255,136,0.15)',
      border: '#4dff88',
    },
    wrong: {
      emoji: '💔',
      title: 'NO MORE CHANCES',
      sub: 'The round is over',
      color: '#ff4d6d',
      bg: 'rgba(255,77,109,0.15)',
      border: '#ff4d6d',
    },
  }

  if (!iAmGuesser) {
    const mySecret =
      myId === game.player1_id ? round.player1_secret : round.player2_secret

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-24 text-center">
        <div className="text-7xl mb-4">⏳</div>
        <h2 className="font-display text-3xl text-rose-soft mb-2">
          Her turn to guess
        </h2>
        <p className="text-rose-soft/70 text-sm mb-6">
          She's guessing your number
        </p>

        <div className="bg-white/5 border border-rose-glow/30 rounded-2xl px-6 py-4">
          <div className="text-[10px] text-rose-soft/60 uppercase tracking-widest mb-1">
            Your secret number
          </div>
          <div className="text-4xl font-black text-rose-glow">{mySecret}</div>
        </div>
      </div>
    )
  }

  const config = feedback ? feedbackConfig[feedback] : null
  const showOptions = options && options.length === 3 && guessesLeft === 1

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-4">
          <h2 className="font-display text-2xl text-rose-soft mb-1">
            Your turn 💘
          </h2>
          <p className="text-rose-soft/60 text-xs">
            Guess her number (1–100)
          </p>
        </div>

        {/* Feedback banner */}
        <AnimatePresence>
          {config && (
            <motion.div
              key={feedback + lastGuess}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-3xl p-5 mb-4 text-center border-2"
              style={{
                background: config.bg,
                borderColor: config.border,
              }}
            >
              <div className="text-5xl mb-1">{config.emoji}</div>
              <div
                className="text-3xl font-black mb-1"
                style={{ color: config.color }}
              >
                {config.title}
              </div>
              <div className="text-xs text-white/70">
                {config.sub}
                {lastGuess ? ` — you said ${lastGuess}` : ''}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* RANGE HINT — always visible, narrows after each guess */}
        {!showOptions && (
          <div className="bg-gradient-to-br from-rose-glow/20 to-purple-500/10 border-2 border-rose-glow/40 rounded-3xl p-5 mb-4 text-center">
            <div className="text-[10px] text-rose-soft/60 uppercase tracking-widest mb-2">
              The number is between
            </div>
            <div className="flex items-center justify-center gap-3">
              <span className="text-4xl font-black text-rose-glow">
                {rangeLow}
              </span>
              <span className="text-rose-soft/60 text-xl">and</span>
              <span className="text-4xl font-black text-rose-glow">
                {rangeHigh}
              </span>
            </div>
            {myHistory.length === 0 && (
              <div className="text-[10px] text-rose-soft/50 mt-2">
                Every wrong guess narrows this down
              </div>
            )}
          </div>
        )}

        {/* Guesses left */}
        <div className="text-center mb-4">
          <span className="text-rose-soft/70 text-sm">
            {guessesLeft > 0
              ? `${guessesLeft} ${guessesLeft === 1 ? 'chance' : 'chances'} left`
              : 'No chances left'}
          </span>
        </div>

        {/* 3-OPTION PICKER on final try */}
        {showOptions ? (
          <div>
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">🎯</div>
              <div className="text-rose-soft font-bold text-lg mb-1">
                Final chance!
              </div>
              <div className="text-rose-soft/70 text-sm">
                One of these three is the right answer
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {options.map((opt) => {
                const isPicked = pickedOption === opt
                return (
                  <motion.button
                    key={opt}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => submitOption(opt)}
                    disabled={pickedOption !== null}
                    className={`py-6 rounded-2xl font-black text-2xl transition ${
                      isPicked
                        ? 'bg-rose-glow text-white shadow-glow'
                        : 'bg-white/5 border-2 border-rose-glow/40 text-rose-soft hover:bg-rose-glow/20'
                    }`}
                  >
                    {opt}
                  </motion.button>
                )
              })}
            </div>

            {pickedOption !== null && (
              <div className="text-center mt-4 text-rose-soft/60 text-sm">
                You picked {pickedOption}... let's see!
              </div>
            )}
          </div>
        ) : (
          <>
            <input
              type="number"
              inputMode="numeric"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="?"
              disabled={guessesLeft <= 0}
              className="w-full text-5xl text-center py-5 rounded-3xl bg-white/5 border-2 border-rose-glow/40 text-white font-black outline-none focus:border-rose-glow disabled:opacity-40 transition"
              autoFocus
            />

            <button
              onClick={submit}
              disabled={!guess || guessesLeft <= 0}
              className="mt-4 w-full py-4 rounded-2xl bg-gradient-to-r from-rose-glow to-pink-600 text-white font-bold text-xl shadow-glow hover:scale-[1.02] disabled:opacity-40 transition"
            >
              GUESS 💘
            </button>
          </>
        )}

        {myHistory.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {myHistory.map((h, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full text-sm font-bold"
                style={{
                  background:
                    h.feedback === 'higher'
                      ? 'rgba(77,166,255,0.25)'
                      : h.feedback === 'lower'
                      ? 'rgba(255,153,77,0.25)'
                      : 'rgba(77,255,136,0.25)',
                  color:
                    h.feedback === 'higher'
                      ? '#4da6ff'
                      : h.feedback === 'lower'
                      ? '#ff994d'
                      : '#4dff88',
                }}
              >
                {h.value}{' '}
                {h.feedback === 'higher'
                  ? '⬆️'
                  : h.feedback === 'lower'
                  ? '⬇️'
                  : '🎉'}
              </span>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}