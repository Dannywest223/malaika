import { motion, AnimatePresence } from 'framer-motion'

export default function MessageToast({ message, onOpen, onClose }) {
  if (!message) {
    return <AnimatePresence />
  }

  const isSticker = message.type === 'sticker'

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={message.id}
          initial={{ y: -80, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -80, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 22 }}
          onClick={onOpen}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] max-w-sm w-[90%] cursor-pointer"
        >
          <div className="bg-rose-deep/95 backdrop-blur-xl border border-rose-glow/40 rounded-2xl p-3 flex items-center gap-3 shadow-glow">
            {/* Her photo */}
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-rose-glow flex-shrink-0">
              <img
                src="/minatallah.jpg"
                alt="Minatallah"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.parentElement.innerHTML =
                    '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:20px">💕</div>'
                }}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="text-xs text-rose-soft font-semibold leading-tight">
                Minatallah Emad Ahmed
              </div>
              {isSticker ? (
                <div className="text-3xl leading-none mt-1">{message.content}</div>
              ) : (
                <div className="text-sm text-white truncate">{message.content}</div>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              className="text-rose-soft/60 text-lg px-2 flex-shrink-0 hover:text-rose-soft transition"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}