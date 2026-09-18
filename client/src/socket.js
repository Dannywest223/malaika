import { io } from 'socket.io-client'

const SERVER_URL = 'https://malaika-game.onrender.com'

export const socket = io(SERVER_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
})

socket.on('connect', () => console.log('✅ Socket connected:', socket.id))
socket.on('disconnect', () => console.log('❌ Socket disconnected'))
socket.on('connect_error', (err) => console.error('⚠️ Socket error:', err.message))