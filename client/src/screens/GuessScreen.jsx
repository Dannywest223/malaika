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

  const roundNumber = round.round_number
  const pickerId = roundNumber % 2 === 1 ? game.player1_id : game.player2_id
  const guesserId = roundNumber % 2 === 1 ? game.player2_id : game.player1_id

  const iAmGuesser = myId === guesserId
  const myScore = myId === game.player1_id ? game.player1_score : game.player2_score
  const herScore = myId === game.player1_id ? game.player2_score : game.player1_score

  // Reset state when a new round starts
  useEffect(() => {
    setFeedback(null)
    setGuess('')
    setLastGuess(null)
    setGuessesLeft(MAX_GUESSES)
    setMyHistory([])

    // Initialize from server state
    if (iAmGuesser) {
      const used =
        myId === game.player1_id
          ? round.player1_guesses_used
          : round.player2_guesses_used
      setGuessesLeft(MAX_GUESSES - used)
    }
  }, [round.id])

  useEffect(() => {
    const handler = ({ feedback, guess: guessedValue, guessesLeft: left }) => {
      setFeedback(feedback)
      setLastGuess(guessedValue)
      if (typeof left === 'number') setGuessesLeft(left)
      setMyHistory((prev) => [...prev, { value: guessedValue, feedback }])
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

  const feedbackConfig = {
    higher: {
      emoji: '⬆️',
      title: 'HIGHER!',
      sub: 'The number is bigger',
      color: '#4da6ff',
      bg: 'rgba(77,166,255,0.15)',
      border: '#4da6ff',
    },
    lower: {
      emoji: '⬇️',
      title: 'LOWER!',
      sub: 'The number is smaller',
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

  // If I'm not the guesser, show waiting screen
  if (!iAmGuesser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="text-xs text-rose-soft/60 mb-2">
          Round {roundNumber} of 15
        </div>
        <div className="flex justify-around mb-6 text-sm w-full max-w-xs">
          <div>
            <div className="text-rose-soft/60 text-xs">You</div>
            <div className="text-2xl font-bold text-rose-soft">{myScore}</div>
          </div>
          <div className="text-rose-glow text-2xl self-center">vs</div>
          <div>
            <div className="text-rose-soft/60 text-xs">Malaika</div>
            <div className="text-2xl font-bold text-rose-soft">{herScore}</div>
          </div>
        </div>
        <div className="text-7xl mb-4">⏳</div>
        <h2 className="font-display text-3xl text-rose-soft mb-2">
          Her turn to guess
        </h2>
        <p className="text-rose-soft/70 text-sm">
          She's guessing your number
        </p>
      </div>
    )
  }

  const config = feedback ? feedbackConfig[feedback] : null

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center text-xs text-rose-soft/60 mb-2">
          Round {roundNumber} of 15
        </div>

        <div className="flex justify-around mb-4 text-sm">
          <div className="text-center">
            <div className="text-rose-soft/60 text-xs">You</div>
            <div className="text-2xl font-bold text-rose-soft">{myScore}</div>
          </div>
          <div className="text-rose-glow text-2xl self-center">vs</div>
          <div className="text-center">
            <div className="text-rose-soft/60 text-xs">Malaika</div>
            <div className="text-2xl font-bold text-rose-soft">{herScore}</div>
          </div>
        </div>

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
              className="rounded-3xl p-6 mb-4 text-center border-2"
              style={{
                background: config.bg,
                borderColor: config.border,
              }}
            >
              <div className="text-6xl mb-2">{config.emoji}</div>
              <div
                className="text-3xl font-black mb-1"
                style={{ color: config.color }}
              >
                {config.title}
              </div>
              <div className="text-xs text-white/70">
                {config.sub}
                {lastGuess ? ` — your guess: ${lastGuess}` : ''}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Guesses left */}
        <div className="text-center mb-3">
          <span className="text-rose-soft/70 text-sm">
            {guessesLeft > 0
              ? `${guessesLeft} ${guessesLeft === 1 ? 'chance' : 'chances'} left`
              : 'No chances left'}
          </span>
        </div>

        {/* Input */}
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

        {/* History chips */}
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