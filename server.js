const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve the frontend
app.use(express.static(path.join(__dirname, 'public')));

// Keep track of connected users
const users = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // User joins with a username
  socket.on('join', (username) => {
    users[socket.id] = username;
    console.log(`${username} joined`);

    // Notify everyone
    io.emit('system', { message: `${username} joined the chat` });

    // Send updated user list to everyone
    io.emit('userList', Object.values(users));
  });

  // User sends a message
  socket.on('message', (text) => {
    const username = users[socket.id] || 'Anonymous';
    console.log(`[${username}]: ${text}`);

    io.emit('message', {
      username,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  });

  // User disconnects
  socket.on('disconnect', () => {
    const username = users[socket.id];
    if (username) {
      delete users[socket.id];
      io.emit('system', { message: `${username} left the chat` });
      io.emit('userList', Object.values(users));
    }
    console.log('User disconnected:', socket.id);
  });
});

// Cloud Run provides PORT via environment variable
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Chat server running on port ${PORT}`);
});
