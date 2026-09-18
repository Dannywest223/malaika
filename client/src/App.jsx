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

export default function App() {
  const [screen, setScreen] = useState('home')
  const [game, setGame] = useState(null)
  const [round, setRound] = useState(null)
  const [myId, setMyId] = useState(null)
  const [connected, setConnected] = useState(socket.connected)

  const [chatOpen, setChatOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [toast, setToast] = useState(null)
  const chatOpenRef = useRef(chatOpen)
  chatOpenRef.current = chatOpen

  useEffect(() => {
    const onConnect = () => { setMyId(socket.id); setConnected(true) }
    socket.on('connect', onConnect)
    socket.on('disconnect', () => setConnected(false))

    socket.on('game_created', (g) => { setGame(g); setScreen('lobby') })
    socket.on('game_started', (g) => setGame(g))
    socket.on('round_started', (r) => { setRound(r); setScreen('pick') })
    socket.on('round_ready', (r) => { setRound(r); setScreen('guess') })
    socket.on('guess_feedback', ({ round }) => setRound(round))
    socket.on('opponent_guessed', ({ round }) => setRound(round))
    socket.on('round_ended', (result) => {
      setRound(result.round); setGame(result.game); setScreen('roundEnd')
    })
    socket.on('error_message', (msg) => alert(msg))

    // Chat notifications
    socket.on('new_message', (msg) => {
      if (msg.sender_id === socket.id) return
      if (chatOpenRef.current) return
      setUnread((u) => u + 1)
      setToast(msg)
      setTimeout(() => setToast(null), 4000)
    })

    if (socket.connected) onConnect()
    return () => { socket.off() }
  }, [])

  const openChat = () => {
    setChatOpen(true)
    setUnread(0)
    setToast(null)
  }

  if (!connected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-rose-soft">
        <div className="text-6xl animate-pulse">💕</div>
        <h2 className="font-display text-2xl">Connecting...</h2>
        <p className="text-rose-soft/60 text-sm">Make sure the server is running</p>
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
        {screen === 'pick' && <PickScreen round={round} myId={myId} game={game} />}
        {screen === 'guess' && <GuessScreen round={round} myId={myId} game={game} />}
        {screen === 'roundEnd' && (
          <RoundEndScreen round={round} game={game} myId={myId} setScreen={setScreen} />
        )}
      </div>

      {/* Chat — only after game starts */}
      {game && (
        <>
          <ChatButton onClick={openChat} unread={unread} />
          <Chat game={game} myId={myId} open={chatOpen} onClose={() => setChatOpen(false)} />
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