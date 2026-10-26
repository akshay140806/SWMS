import { io } from 'socket.io-client';
let socket = null;
export function getSocket() {
  if (!socket) {
    const rawUrl = import.meta.env.VITE_API_URL || '';
    const socketUrl = rawUrl ? rawUrl.replace(/\/+$/, '') : (import.meta.env.PROD ? window.location.origin : 'http://localhost:5000');
    socket = io(socketUrl, { transports: ['websocket', 'polling'] });
  }
  return socket;
}
