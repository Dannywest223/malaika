import { useEffect, useState, useRef } from 'react'
import { socket } from './socket'
import FloatingHearts from './components/FloatingHearts'
import MusicPlayer from './components/MusicPlayer'
import ScoreBar from './components/ScoreBar'
import Chat from './components/Chat'
import ChatButton from './components/ChatButton'
import MessageToast from './components/MessageToast'
import HomeScreen from './screens/HomeScreen'
import LobbyScreen from './screens/LobbyScreen'
import GameMenuScreen from './screens/GameMenuScreen'
import PickScreen from './screens/PickScreen'
import GuessScreen from './screens/GuessScreen'
import RoundEndScreen from './screens/RoundEndScreen'
import GameOverScreen from './screens/GameOverScreen'
import WYRGameScreen from './screens/WYRGameScreen'
import KnowMeGameScreen from './screens/KnowMeGameScreen'
import TruthsGameScreen from './screens/TruthsGameScreen'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [game, setGame] = useState(null)
  const [round, setRound] = useState(null)
  const [roundResult, setRoundResult] = useState(null)
  const [myId, setMyId] = useState(socket.id)
  const [connected, setConnected] = useState(socket.connected)
  const [gameType, setGameType] = useState(null)
  const [wyrRound, setWyrRound] = useState(null)
  const [knowMeRound, setKnowMeRound] = useState(null)
  const [truthsRound, setTruthsRound] = useState(null)

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
      console.log('✅ onConnect fired', socket.id)
      setMyId(socket.id)
      setConnected(true)
    }
    const onDisconnect = () => {
      console.log('❌ disconnected')
      setConnected(false)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    socket.on('game_created', (g) => {
      setGame(g)
      setScreen('lobby')
    })

    socket.on('game_started', (g) => {
      setGame(g)
      setScreen('menu')
    })

    socket.on('game_type_selected', ({ gameType: gt, game: g }) => {
      setGameType(gt)
      setGame(g)
    })

    socket.on('partner_selected', ({ gameType: gt }) => {
      console.log('👀 Partner selected:', gt)
    })

    // ---- Guess My Number ----
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

    socket.on('round_ended', (result) => {
      setRound(result.round)
      setGame(result.game)
      setRoundResult(result)
      setScreen('roundEnd')
    })

    // ---- Would You Rather ----
    socket.on('wyr_game_started', () => {
      setScreen('wyr')
    })

    socket.on('wyr_round_started', (r) => {
      setWyrRound(r)
      setScreen('wyr')
    })

    socket.on('wyr_round_ended', (result) => {
      setGame(result.game)
    })

    // ---- How Well Do You Know Me ----
    socket.on('knowme_game_started', () => {
      setScreen('knowme')
    })

    socket.on('knowme_round_started', (r) => {
      setKnowMeRound(r)
      setScreen('knowme')
    })

    socket.on('knowme_answers_submitted', (r) => {
      setKnowMeRound(r)
    })

    socket.on('knowme_round_ended', (result) => {
      setGame(result.game)
    })

    // ---- Two Truths and a Lie ----
    socket.on('truths_game_started', () => {
      setScreen('truths')
    })

    socket.on('truths_round_started', (r) => {
      setTruthsRound(r)
      setScreen('truths')
    })

    socket.on('truths_statements_submitted', (r) => {
      setTruthsRound(r)
    })

    socket.on('truths_round_ended', (result) => {
      setGame(result.game)
    })

    socket.on('error_message', (msg) => {
      console.log('⚠️ server error:', msg)
    })

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
      socket.off('game_created')
      socket.off('game_started')
      socket.off('game_type_selected')
      socket.off('partner_selected')
      socket.off('round_started')
      socket.off('round_ready')
      socket.off('guess_feedback')
      socket.off('round_ended')
      socket.off('wyr_game_started')
      socket.off('wyr_round_started')
      socket.off('wyr_round_ended')
      socket.off('knowme_game_started')
      socket.off('knowme_round_started')
      socket.off('knowme_answers_submitted')
      socket.off('knowme_round_ended')
      socket.off('truths_game_started')
      socket.off('truths_round_started')
      socket.off('truths_statements_submitted')
      socket.off('truths_round_ended')
      socket.off('error_message')
      socket.off('new_message')
    }
  }, [])

  const openChat = () => {
    setChatOpen(true)
    setUnread(0)
    setToast(null)
  }
  const closeChat = () => setChatOpen(false)

  const handleRematch = () => {
    setRound(null)
    setRoundResult(null)
    setGameType(null)
    setWyrRound(null)
    setKnowMeRound(null)
    setTruthsRound(null)
    setScreen('menu')
  }

  const handleNewGame = () => {
    setGame(null)
    setRound(null)
    setRoundResult(null)
    setGameType(null)
    setWyrRound(null)
    setKnowMeRound(null)
    setTruthsRound(null)
    setScreen('home')
    socket.emit('create_game')
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

  const showScoreBar =
    game &&
    screen !== 'home' &&
    screen !== 'lobby' &&
    screen !== 'menu' &&
    screen !== 'gameOver'

  return (
    <div className="relative min-h-screen">
      <FloatingHearts />
      <MusicPlayer hidden={chatOpen} />

      {showScoreBar && <ScoreBar game={game} myId={myId} round={round} />}

      <div className="relative z-10">
        {screen === 'home' && <HomeScreen />}
        {screen === 'lobby' && <LobbyScreen game={game} />}
        {screen === 'menu' && <GameMenuScreen game={game} myId={myId} />}
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
        {screen === 'wyr' && (
          <WYRGameScreen
            game={game}
            myId={myId}
            round={wyrRound}
            setScreen={setScreen}
          />
        )}
        {screen === 'knowme' && (
          <KnowMeGameScreen
            game={game}
            myId={myId}
            round={knowMeRound}
            setScreen={setScreen}
          />
        )}
        {screen === 'truths' && (
          <TruthsGameScreen
            game={game}
            myId={myId}
            round={truthsRound}
            setScreen={setScreen}
          />
        )}
        {screen === 'gameOver' && (
          <GameOverScreen
            game={game}
            myId={myId}
            onRematch={handleRematch}
            onNewGame={handleNewGame}
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
            onClose={closeChat}
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