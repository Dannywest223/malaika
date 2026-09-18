import { io } from 'socket.io-client'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000'

export const socket = io(SERVER_URL, {
  autoConnect: true,
})

socket.on('connect', () => console.log('✅ Socket connected:', socket.id))
socket.on('disconnect', () => console.log('❌ Socket disconnected'))
socket.on('connect_error', (err) => console.error('⚠️ Socket error:', err.message))