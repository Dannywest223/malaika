import { useEffect, useRef, useState } from 'react'

export default function MusicPlayer() {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [unmuted, setUnmuted] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.loop = true
    audio.volume = 0 // start silent — browsers allow muted autoplay

    // Try to start playing immediately (muted)
    const tryMutedAutoplay = async () => {
      try {
        await audio.play()
        setPlaying(true)
        console.log('🎵 Audio started (muted autoplay)')
      } catch (err) {
        console.log('⚠️ Muted autoplay blocked:', err.message)
      }
    }

    tryMutedAutoplay()

    // Unmute on the FIRST user interaction anywhere
    const unmute = () => {
      if (unmuted) return
      const a = audioRef.current
      if (!a) return

      // If audio isn't playing yet, start it now
      if (a.paused) {
        a.play().catch(() => {})
      }

      // Fade volume in gently
      a.muted = false
      let v = 0
      const fade = setInterval(() => {
        v = Math.min(0.35, v + 0.02)
        a.volume = v
        if (v >= 0.35) clearInterval(fade)
      }, 50)

      setPlaying(true)
      setUnmuted(true)
      console.log('🔊 Audio unmuted after user gesture')

      // Remove the listeners once done
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

  return (
    <>
      <audio
        ref={audioRef}
        src="/music/romantic.mp3"
        preload="auto"
        loop
        playsInline
      />

      {/* Small play/pause button in the corner */}
      <button
        onClick={toggle}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-rose-glow/20 backdrop-blur border border-rose-glow/50 text-white text-xl shadow-soft hover:scale-110 transition"
        title={playing ? 'Pause music' : 'Play music'}
      >
        {playing ? '⏸️' : '▶️'}
      </button>

      {/* Small prompt — only shows until she taps once */}
      {!unmuted && (
        <div className="fixed bottom-24 right-6 z-50 text-xs text-rose-soft/70 bg-rose-deep/80 backdrop-blur px-3 py-2 rounded-full border border-rose-glow/30 animate-pulse">
          Tap anywhere for music 🎵
        </div>
      )}
    </>
  )
}