export default function WaitingScreen() {
    return (
      <div style={styles.container}>
        <div style={{ fontSize: 60 }}>⏳</div>
        <h2 style={{ color: '#ff9ec7' }}>Waiting...</h2>
      </div>
    )
  }
  
  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    },
  }