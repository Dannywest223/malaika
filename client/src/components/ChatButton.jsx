import { motion } from 'framer-motion'

export default function ChatButton({ onClick, unread }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-8 left-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-rose-glow to-pink-600 shadow-glow flex items-center justify-center text-2xl"
    >
      💬
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center border-2 border-rose-deep">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </motion.button>
  )
}