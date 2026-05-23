const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Firestore } = require('@google-cloud/firestore');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Initialize Firestore — picks up credentials automatically (ADC locally, service account on Cloud Run)
const db = new Firestore({
  projectId: 'project-db9efd6c-428f-42e0-ad5',
  databaseId: 'simplechatdb',
});
const messagesRef = db.collection('messages');

// How many messages to load on startup
const MESSAGE_HISTORY_LIMIT = 100;

// Serve the frontend
app.use(express.static(path.join(__dirname, 'public')));

// Keep track of connected users
const users = {};

io.on('connection', async (socket) => {
  console.log('A user connected:', socket.id);

  // Send last 100 messages to the newly connected user
  try {
    const snapshot = await messagesRef
      .orderBy('timestamp', 'asc')
      .limitToLast(MESSAGE_HISTORY_LIMIT)
      .get();

    const history = snapshot.docs.map(doc => doc.data());
    socket.emit('history', history);
  } catch (err) {
    console.error('Failed to load message history:', err);
  }

  // User joins with a username
  socket.on('join', (username) => {
    users[socket.id] = username;
    console.log(`${username} joined`);

    io.emit('system', { message: `${username} joined the chat` });
    io.emit('userList', Object.values(users));
  });

  // User sends a message
  socket.on('message', async (text) => {
    const username = users[socket.id] || 'Anonymous';
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const msgData = { username, text, time, timestamp: Date.now() };

    // Broadcast to everyone live
    io.emit('message', msgData);

    // Save to Firestore
    try {
      await messagesRef.add(msgData);
      console.log(`[${username}]: ${text} — saved to Firestore`);
    } catch (err) {
      console.error('Failed to save message:', err);
    }
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

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Chat server running on port ${PORT}`);
});
