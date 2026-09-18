import { motion, AnimatePresence } from 'framer-motion'

export default function MessageToast({ message, onOpen, onClose }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          onClick={onOpen}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] max-w-sm w-[90%] cursor-pointer"
        >
          <div className="bg-rose-deep/95 backdrop-blur-xl border border-rose-glow/40 rounded-2xl p-3 flex items-center gap-3 shadow-glow">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-rose-glow flex-shrink-0">
              <img src="/malaika.jpg" alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-rose-soft font-semibold">Malaika 💕</div>
              <div className="text-sm text-white truncate">{message.content}</div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onClose() }}
              className="text-rose-soft/60 text-lg px-2"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}