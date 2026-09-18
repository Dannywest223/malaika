import { useEffect, useState, useRef } from 'react'
import { socket } from './socket'
import FloatingHearts from './components/FloatingHearts'
import MusicPlayer from './components/MusicPlayer'
import Chat from './components/Chat'
import ChatButton from './components/ChatButton'
import MessageToast from './components/MessageToast'
import HomeScreen from './screens/HomeScreen'
import LobbyScreen from './screens/LobbyScreen'
import PickScreen from './screens/PickScreen'
import GuessScreen from './screens/GuessScreen'
import RoundEndScreen from './screens/RoundEndScreen'
import GameOverScreen from './screens/GameOverScreen'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [game, setGame] = useState(null)
  const [round, setRound] = useState(null)
  const [roundResult, setRoundResult] = useState(null)
  const [myId, setMyId] = useState(socket.id)
  const [connected, setConnected] = useState(socket.connected)

  const [chatOpen, setChatOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [toast, setToast] = useState(null)
  const chatOpenRef = useRef(chatOpen)
  chatOpenRef.current = chatOpen

  useEffect(() => {
    if (socket.connected) {
      setMyId(socket.id)
      setConnected(true)
    }

    const onConnect = () => {
      setMyId(socket.id)
      setConnected(true)
    }
    const onDisconnect = () => setConnected(false)

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    socket.on('game_created', (g) => {
      setGame(g)
      setScreen('lobby')
    })
    socket.on('game_started', (g) => setGame(g))
    socket.on('round_started', (r) => {
      setRound(r)
      setRoundResult(null)
      setScreen('pick')
    })
    socket.on('round_ready', (r) => {
      setRound(r)
      setScreen('guess')
    })
    socket.on('guess_feedback', ({ round: r }) => {
      setRound(r)
    })
    socket.on('opponent_guessed', ({ round: r }) => {
      setRound(r)
    })
    socket.on('round_ended', (result) => {
      setRound(result.round)
      setGame(result.game)
      setRoundResult(result)
      setScreen('roundEnd')
    })
    socket.on('error_message', (msg) => alert(msg))

    socket.on('new_message', (msg) => {
      if (msg.sender_id === socket.id) return
      if (chatOpenRef.current) return
      setUnread((u) => u + 1)
      setToast(msg)
      setTimeout(() => setToast(null), 4000)
    })

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
    }
  }, [])

  const openChat = () => {
    setChatOpen(true)
    setUnread(0)
    setToast(null)
  }

  const handleRematch = () => {
    socket.emit('create_game')
    setGame(null)
    setRound(null)
    setRoundResult(null)
    setScreen('home')
  }

  if (!connected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-rose-soft">
        <div className="text-6xl animate-pulse">💕</div>
        <h2 className="font-display text-2xl">Connecting...</h2>
        <p className="text-rose-soft/60 text-sm">
          Make sure the server is running
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-5 py-2 rounded-full bg-rose-glow text-white text-sm"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      <FloatingHearts />
      <MusicPlayer />

      <div className="relative z-10">
        {screen === 'home' && <HomeScreen />}
        {screen === 'lobby' && <LobbyScreen game={game} />}
        {screen === 'pick' && (
          <PickScreen round={round} myId={myId} game={game} />
        )}
        {screen === 'guess' && (
          <GuessScreen round={round} myId={myId} game={game} />
        )}
        {screen === 'roundEnd' && (
          <RoundEndScreen
            round={round}
            game={game}
            myId={myId}
            setScreen={setScreen}
            roundResult={roundResult}
          />
        )}
        {screen === 'gameOver' && (
          <GameOverScreen
            game={game}
            myId={myId}
            onRematch={handleRematch}
          />
        )}
      </div>

      {game && (
        <>
          <ChatButton onClick={openChat} unread={unread} />
          <Chat
            game={game}
            myId={myId}
            open={chatOpen}
            onClose={() => setChatOpen(false)}
          />
          <MessageToast
            message={toast}
            onOpen={openChat}
            onClose={() => setToast(null)}
          />
        </>
      )}
    </div>
  )
}