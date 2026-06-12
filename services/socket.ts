import { io } from 'socket.io-client';

// PENTING: Ganti URL ini dengan IP Publik VM Cloud Anda (misal: http://34.101.88.99:3000)
// Untuk testing lokal di komputer, gunakan http://localhost:3000
const SOCKET_URL = 'http://localhost:3000';

export const socket = io(SOCKET_URL, {
  autoConnect: false, // Kita akan connect secara manual saat masuk ke ChatRoom
  reconnection: true,
});
