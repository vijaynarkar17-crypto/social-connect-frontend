import { io, type Socket } from 'socket.io-client';
import { API_BASE } from './api';

// In production the socket connects to the deployed API; in local dev it targets
// the backend directly (Vite only proxies HTTP, not the socket transport).
const SOCKET_URL = API_BASE || 'http://localhost:4000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function joinUserRoom(userId: string): void {
  getSocket().emit('join', `user:${userId}`);
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
