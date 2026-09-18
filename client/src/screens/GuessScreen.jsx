import { useState, useEffect } from 'react'
import { socket } from '../socket'

const MAX_GUESSES = 3

export default function GuessScreen({ round, myId, game }) {
  const [guess, setGuess] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [myHistory, setMyHistory] = useState([])

  const isPlayer1 = myId === game.player1_id
  const myGuessesUsed = isPlayer1 ? round.player1_guesses_used : round.player2_guesses_used
  const isMyTurn = round.turn_player_id === myId

  useEffect(() => {
    const handler = ({ feedback, guess }) => {
      setFeedback(feedback)
      setMyHistory((prev) => [...prev, { value: guess, feedback }])
    }
    socket.on('guess_feedback', handler)
    return () => socket.off('guess_feedback', handler)
  }, [])

  const submit = () => {
    const value = parseInt(guess)
    if (!value || value < 1 || value > 100) return
    socket.emit('submit_guess', { roundId: round.id, guess: value })
    setGuess('')
  }

  const feedbackConfig = {
    higher: { emoji: '⬆️', title: 'HIGHER!', sub: 'My number is bigger', color: '#4da6ff' },
    lower: { emoji: '⬇️', title: 'LOWER!', sub: 'My number is smaller', color: '#ff994d' },
    correct: { emoji: '🎉', title: 'CORRECT!', sub: 'You found it!', color: '#4dff88' },
  }

  // If it's not my turn, show waiting screen
  if (!isMyTurn) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ fontSize: 60, marginBottom: 12 }}>⏳</div>
          <h2 style={{ color: '#ff9ec7' }}>Her turn...</h2>
          <p style={{ color: '#aaa' }}>She's guessing your number</p>
          <p style={{ color: '#888', fontSize: 13, marginTop: 24 }}>
            Your guesses left: {MAX_GUESSES - myGuessesUsed}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={{ color: '#ff9ec7', marginBottom: 4 }}>Your turn 💘</h2>
        <p style={{ color: '#aaa', fontSize: 14, marginBottom: 20 }}>
          Guess her number (1-100)
        </p>

        {/* Feedback banner */}
        {feedback && (
          <div
            style={{
              ...styles.feedbackBox,
              borderColor: feedbackConfig[feedback].color,
            }}
          >
            <div style={{ fontSize: 60 }}>{feedbackConfig[feedback].emoji}</div>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: feedbackConfig[feedback].color }}>
              {feedbackConfig[feedback].title}
            </div>
            <div style={{ color: '#ccc', fontSize: 14 }}>
              {feedbackConfig[feedback].sub}
            </div>
          </div>
        )}

        {/* Input */}
        <input
          type="number"
          inputMode="numeric"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="?"
          style={styles.bigInput}
          autoFocus
        />

        <button
          onClick={submit}
          disabled={!guess}
          style={styles.primaryBtn}
        >
          GUESS 💘
        </button>

        {/* Guesses left */}
        <div style={{ marginTop: 20, color: '#aaa', fontSize: 14 }}>
          Guesses left: <b style={{ color: '#ff9ec7' }}>{MAX_GUESSES - myGuessesUsed}</b>
        </div>

        {/* Past guesses */}
        {myHistory.length > 0 && (
          <div style={styles.history}>
            {myHistory.map((h, i) => (
              <span
                key={i}
                style={{
                  ...styles.chip,
                  background:
                    h.feedback === 'higher' ? 'rgba(77,166,255,0.25)' :
                    h.feedback === 'lower' ? 'rgba(255,153,77,0.25)' :
                    'rgba(77,255,136,0.25)',
                  color:
                    h.feedback === 'higher' ? '#4da6ff' :
                    h.feedback === 'lower' ? '#ff994d' :
                    '#4dff88',
                }}
              >
                {h.value} {h.feedback === 'higher' ? '⬆️' : h.feedback === 'lower' ? '⬇️' : '🎉'}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,105,180,0.3)',
    borderRadius: 24,
    padding: 28,
    textAlign: 'center',
    maxWidth: 420,
    width: '100%',
  },
  feedbackBox: {
    border: '2px solid',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    background: 'rgba(255,255,255,0.03)',
  },
  bigInput: {
    width: '100%',
    fontSize: 60,
    padding: 16,
    textAlign: 'center',
    background: 'rgba(255,255,255,0.05)',
    border: '2px solid rgba(255,105,180,0.4)',
    borderRadius: 20,
    color: 'white',
    fontWeight: 'bold',
    outline: 'none',
    marginBottom: 16,
  },
  primaryBtn: {
    width: '100%',
    padding: 18,
    background: '#ff4d9e',
    color: 'white',
    borderRadius: 16,
    fontSize: 20,
    fontWeight: 'bold',
  },
  history: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 16,
  },
  chip: {
    padding: '6px 12px',
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 'bold',
  },
}