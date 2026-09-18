import { useEffect, useRef, useState } from 'react'

export default function MusicPlayer({ hidden = false }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [unmuted, setUnmuted] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.loop = true
    audio.volume = 0

    const tryMutedAutoplay = async () => {
      try {
        await audio.play()
        setPlaying(true)
      } catch (err) {
        console.log('⚠️ Muted autoplay blocked:', err.message)
      }
    }

    tryMutedAutoplay()

    const unmute = () => {
      if (unmuted) return
      const a = audioRef.current
      if (!a) return

      if (a.paused) {
        a.play().catch(() => {})
      }

      a.muted = false
      let v = 0
      const fade = setInterval(() => {
        v = Math.min(0.35, v + 0.02)
        a.volume = v
        if (v >= 0.35) clearInterval(fade)
      }, 50)

      setPlaying(true)
      setUnmuted(true)

      ;['click', 'touchstart', 'keydown', 'scroll'].forEach((e) =>
        document.removeEventListener(e, unmute)
      )
    }

    ;['click', 'touchstart', 'keydown', 'scroll'].forEach((e) =>
      document.addEventListener(e, unmute, { passive: true })
    )

    return () => {
      ;['click', 'touchstart', 'keydown', 'scroll'].forEach((e) =>
        document.removeEventListener(e, unmute)
      )
    }
  }, [])

  const toggle = () => {
    const a = audioRef.current
    if (!a) return
    if (a.paused) {
      a.play()
      setPlaying(true)
    } else {
      a.pause()
      setPlaying(false)
    }
  }

  // Hide entirely when chat is open — no more collision
  if (hidden) {
    return (
      <audio
        ref={audioRef}
        src="/music/romantic.mp3"
        preload="auto"
        loop
        playsInline
      />
    )
  }

  return (
    <>
      <audio
        ref={audioRef}
        src="/music/romantic.mp3"
        preload="auto"
        loop
        playsInline
      />

      {/* Music button — moved UP so it never collides with chat send */}
      <button
        onClick={toggle}
        className="fixed bottom-24 right-4 z-40 w-11 h-11 rounded-full bg-rose-glow/20 backdrop-blur border border-rose-glow/50 text-white text-lg shadow-soft hover:scale-110 transition"
        title={playing ? 'Pause music' : 'Play music'}
      >
        {playing ? '⏸️' : '▶️'}
      </button>

      {/* Prompt — moved UP and left a bit */}
      {!unmuted && (
        <div className="fixed bottom-40 right-4 z-40 text-[10px] text-rose-soft/70 bg-rose-deep/80 backdrop-blur px-2 py-1 rounded-full border border-rose-glow/30 animate-pulse">
          Tap for music 🎵
        </div>
      )}
    </>
  )
}