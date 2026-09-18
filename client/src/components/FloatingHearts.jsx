import { useEffect, useState } from 'react'

export default function FloatingHearts() {
  const [hearts, setHearts] = useState([])

  useEffect(() => {
    const spawn = () => {
      const id = Date.now() + Math.random()
      setHearts((h) => [
        ...h,
        {
          id,
          left: Math.random() * 100,
          size: 10 + Math.random() * 20,
          duration: 8 + Math.random() * 8,
          delay: Math.random() * 2,
          emoji: ['💕', '💖', '💗', '❤️', '💘'][Math.floor(Math.random() * 5)],
        },
      ])
      setTimeout(() => {
        setHearts((h) => h.filter((x) => x.id !== id))
      }, 18000)
    }

    const interval = setInterval(spawn, 1200)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {hearts.map((h) => (
        <div
          key={h.id}
          className="absolute animate-float-up"
          style={{
            left: `${h.left}%`,
            fontSize: h.size,
            animationDuration: `${h.duration}s`,
            animationDelay: `${h.delay}s`,
            opacity: 0.6,
          }}
        >
          {h.emoji}
        </div>
      ))}
      <style>{`
        @keyframes float-up {
          0% { transform: translateY(100vh) scale(0.5); opacity: 0; }
          10% { opacity: 0.7; }
          90% { opacity: 0.7; }
          100% { transform: translateY(-10vh) scale(1.2) rotate(20deg); opacity: 0; }
        }
        .animate-float-up {
          animation: float-up linear infinite;
        }
      `}</style>
    </div>
  )
}