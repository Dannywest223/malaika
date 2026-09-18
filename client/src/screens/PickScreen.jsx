import { useState, useEffect } from 'react'
import { socket } from '../socket'

export default function PickScreen({ round, myId, game }) {
  const [num, setNum] = useState('')
  const [waiting, setWaiting] = useState(false)
  const [opponentReady, setOpponentReady] = useState(false)

  useEffect(() => {
    const handler = () => setOpponentReady(true)
    socket.on('opponent_ready', handler)
    return () => socket.off('opponent_ready', handler)
  }, [])

  const submit = () => {
    const value = parseInt(num)
    if (!value || value < 1 || value > 100) {
      alert('Pick a number between 1 and 100')
      return
    }
    socket.emit('pick_secret', { roundId: round.id, number: value })
    setWaiting(true)
  }

  if (waiting) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ fontSize: 60 }}>🔒</div>
          <h2 style={{ color: '#ff9ec7' }}>Number locked!</h2>
          <p style={{ color: '#aaa' }}>
            {opponentReady
              ? 'She locked hers too. Starting...'
              : 'Waiting for her to pick her number...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ fontSize: 60, marginBottom: 12 }}>🤫</div>
        <h2 style={{ color: '#ff9ec7', marginBottom: 8 }}>Pick a secret number</h2>
        <p style={{ color: '#aaa', fontSize: 14, marginBottom: 24 }}>
          Between 1 and 100 — she'll try to guess it
        </p>
        <input
          type="number"
          inputMode="numeric"
          value={num}
          onChange={(e) => setNum(e.target.value)}
          placeholder="?"
          style={styles.bigInput}
          autoFocus
        />
        <button
          onClick={submit}
          disabled={!num}
          style={styles.primaryBtn}
        >
          Lock it in 🔒
        </button>
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
    padding: 32,
    textAlign: 'center',
    maxWidth: 400,
    width: '100%',
  },
  bigInput: {
    width: '100%',
    fontSize: 72,
    padding: 20,
    textAlign: 'center',
    background: 'rgba(255,255,255,0.05)',
    border: '2px solid rgba(255,105,180,0.4)',
    borderRadius: 20,
    color: 'white',
    fontWeight: 'bold',
    outline: 'none',
    marginBottom: 20,
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
}