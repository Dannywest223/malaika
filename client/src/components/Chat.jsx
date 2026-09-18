import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { socket } from '../socket'

const QUICK_REPLIES = [
  'You are so cute 🥰',
  'I love you 💕',
  'You are going down 😏',
  'Stop cheating 😤',
  'Kiss me 💋',
  'You are my favorite person ❤️',
  'I miss you so much 🥺',
  'Come here 😘',
  'You smell nice 🌸',
  'You are the best 💘',
]

const STICKERS = ['💋', '💕', '😘', '🥰', '😈', '🤭', '💖', '🌹', '🍓', '🐻', '🥺', '😻']

export default function Chat({ game, myId, open, onClose, unread }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [showStickers, setShowStickers] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (!game) return
    socket.emit('load_messages', { gameId: game.id })

    const onHistory = (msgs) => setMessages(msgs)
    const onNew = (msg) => setMessages((m) => [...m, msg])

    socket.on('message_history', onHistory)
    socket.on('new_message', onNew)
    return () => {
      socket.off('message_history', onHistory)
      socket.off('new_message', onNew)
    }
  }, [game])

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, open])

  const send = (content, type = 'text') => {
    if (!content.trim()) return
    socket.emit('send_message', { gameId: game.id, content, type })
    setInput('')
    setShowStickers(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25 }}
          className="fixed inset-y-0 right-0 w-full max-w-md bg-rose-deep/95 backdrop-blur-xl border-l border-rose-glow/30 z-40 flex flex-col shadow-glow"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-rose-glow/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-rose-glow">
                <img src="/malaika.jpg" alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="font-display text-lg text-rose-soft">Malaika</div>
                <div className="text-xs text-green-400">● online</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/5 text-rose-soft hover:bg-white/10"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-rose-soft/50 text-sm mt-8">
                Say something sweet 💕
              </div>
            )}
            {messages.map((m) => {
              const mine = m.sender_id === myId
              const isSticker = m.type === 'sticker'
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={
                      isSticker
                        ? 'text-5xl'
                        : `max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                            mine
                              ? 'bg-gradient-to-br from-rose-glow to-pink-600 text-white'
                              : 'bg-white/10 text-rose-soft'
                          }`
                    }
                  >
                    {m.content}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Sticker picker */}
          <AnimatePresence>
            {showStickers && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-rose-glow/20 p-3"
              >
                <div className="grid grid-cols-6 gap-2">
                  {STICKERS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s, 'sticker')}
                      className="text-3xl py-2 rounded-xl hover:bg-white/10"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick replies */}
          <div className="border-t border-rose-glow/20 p-3 overflow-x-auto">
            <div className="flex gap-2">
              {QUICK_REPLIES.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="whitespace-nowrap px-3 py-2 rounded-full bg-white/5 border border-rose-glow/30 text-xs text-rose-soft hover:bg-rose-glow/20"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-3 border-t border-rose-glow/20 flex items-center gap-2">
            <button
              onClick={() => setShowStickers((s) => !s)}
              className="w-11 h-11 rounded-full bg-white/5 text-2xl"
            >
              😊
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send(input)}
              placeholder="Type something sweet..."
              className="flex-1 py-3 px-4 rounded-full bg-white/5 border border-rose-glow/30 text-white placeholder-rose-soft/40 outline-none focus:border-rose-glow"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim()}
              className="w-11 h-11 rounded-full bg-gradient-to-br from-rose-glow to-pink-600 text-white disabled:opacity-40"
            >
              💌
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}