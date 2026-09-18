import { socket } from '../socket'

export default function RoundEndScreen({ round, game, myId, setScreen }) {
  const iWon = round.winner_id === myId
  const isDraw = !round.winner_id

  const next = () => {
    socket.emit('next_round', { gameId: game.id })
    setScreen('pick')
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ fontSize: 70, marginBottom: 12 }}>
          {isDraw ? '🤝' : iWon ? '🏆' : '💔'}
        </div>
        <h1 style={{ color: '#ff9ec7', marginBottom: 12 }}>
          {isDraw ? 'Draw!' : iWon ? 'You won!' : 'She won!'}
        </h1>

        <div style={styles.scoreRow}>
          <div>
            <div style={{ color: '#aaa', fontSize: 12 }}>Round {round.round_number}</div>
            <div style={{ marginTop: 12, color: '#4da6ff', fontSize: 14 }}>
              Your guesses: {myId === game.player1_id ? round.player1_guesses_used : round.player2_guesses_used}
            </div>
            <div style={{ color: '#ff994d', fontSize: 14 }}>
              Her guesses: {myId === game.player1_id ? round.player2_guesses_used : round.player1_guesses_used}
            </div>
          </div>
        </div>

        <div style={styles.totalScore}>
          <div style={{ fontSize: 14, color: '#aaa', marginBottom: 8 }}>Total Score</div>
          <div style={{ fontSize: 22, fontWeight: 'bold' }}>
            You: <span style={{ color: '#ff4d9e' }}>
              {myId === game.player1_id ? game.player1_score : game.player2_score}
            </span>
            {'  ·  '}
            Her: <span style={{ color: '#ff9ec7' }}>
              {myId === game.player1_id ? game.player2_score : game.player1_score}
            </span>
          </div>
        </div>

        <button onClick={next} style={styles.primaryBtn}>
          Next Round ➡️
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
    maxWidth: 420,
    width: '100%',
  },
  totalScore: {
    background: 'rgba(255,105,180,0.1)',
    borderRadius: 16,
    padding: 20,
    margin: '24px 0',
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
  scoreRow: {
    color: '#ccc',
  },
}