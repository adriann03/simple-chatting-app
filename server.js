const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // Izinkan semua origin untuk testing
    methods: ["GET", "POST"]
  }
});

const PORT = 3000;

app.use(cors());
app.use(express.json());

// MySQL Connection Pool
const pool = mysql.createPool({
  host: 'localhost', 
  user: 'root',      
  password: 'password', 
  database: 'atmosphere_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// REST API: Create Group
app.post('/api/groups/create', async (req, res) => {
  const { groupId, groupName, key } = req.body;
  if (!groupId || !groupName || !key) return res.status(400).json({ error: 'Missing fields' });

  try {
    await pool.execute(
      'INSERT INTO cloud_groups (group_id, group_name, frequency_key) VALUES (?, ?, ?)',
      [groupId, groupName, key]
    );
    console.log(`[SUCCESS] Group created: ${groupName}`);
    res.status(201).json({ message: 'Success', group: { group_id: groupId, group_name: groupName, frequency_key: key } });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Group ID exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

// SOCKET.IO: Real-Time Chat Logic
io.on('connection', (socket) => {
  console.log(`[SOCKET] User connected: ${socket.id}`);

  // User bergabung ke "Room" (Bisa ID Grup atau ID Personal)
  socket.on('join_chat', (roomName) => {
    socket.join(roomName);
    console.log(`[SOCKET] User ${socket.id} joined room: ${roomName}`);
  });

  // User mengirim pesan
  socket.on('send_message', async (data) => {
    const { roomName, message } = data;
    
    console.log(`[SOCKET] Message sent to room ${roomName} from ${message.sender_id}`);

    // 1. Teruskan pesan ke semua orang di room tersebut (KECUALI pengirim)
    socket.to(roomName).emit('receive_message', message);

    // 2. Simpan pesan ke Database MySQL Cloud sebagai backup
    try {
      await pool.execute(
        `INSERT INTO cloud_messages 
        (message_id, chat_id, sender_id, message_type, message_text, media_data, file_name, timestamp, is_read) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          message.message_id, 
          message.chat_id, 
          message.sender_id, 
          message.message_type, 
          message.message_text || '', 
          message.media_data || null, 
          message.file_name || null, 
          message.timestamp,
          false
        ]
      );
    } catch (err) {
      console.error('[DB ERROR] Failed to save message:', err);
    }
  });

  // User membaca pesan
  socket.on('mark_messages_read', async (data) => {
    const { roomName, messageIds } = data;
    if (!messageIds || messageIds.length === 0) return;

    console.log(`[SOCKET] Messages read in room ${roomName}:`, messageIds);

    // Beritahu pengirim bahwa pesannya telah dibaca
    socket.to(roomName).emit('messages_read', { messageIds });

    // Update status di Database MySQL Cloud
    try {
      const placeholders = messageIds.map(() => '?').join(',');
      await pool.execute(
        `UPDATE cloud_messages SET is_read = TRUE WHERE message_id IN (${placeholders})`,
        messageIds
      );
    } catch (err) {
      console.error('[DB ERROR] Failed to update read status:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[SOCKET] User disconnected: ${socket.id}`);
  });
});

// Start Server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Atmosphere Cloud API & Socket.IO running on http://0.0.0.0:${PORT}`);
});
