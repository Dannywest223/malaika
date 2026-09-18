export default function LobbyScreen({ game }) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={{ color: '#ff9ec7', marginBottom: 12 }}>Waiting for her... 💕</h2>
          <p style={{ color: '#aaa', marginBottom: 20 }}>Share this code:</p>
          <div style={styles.code}>{game?.id}</div>
          <p style={{ color: '#888', fontSize: 14, marginTop: 16 }}>
            She opens the app → "Join Game" → enters this code
          </p>
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
    },
    code: {
      fontSize: 48,
      fontWeight: 'bold',
      letterSpacing: 8,
      color: '#ff4d9e',
      padding: '20px 0',
    },
  }