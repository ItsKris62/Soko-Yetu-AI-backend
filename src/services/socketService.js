// backend/services/socketService.js
const socketIo = require('socket.io');
const Message = require('../models/message');
const { logAudit } = require('../utils/auditLogger');
const logger = require('../config/logger');

let io;

const socketService = {
  init(server) {
    io = socketIo(server, {
      cors: {
        origin: process.env.CLIENT_URL || '*',
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', (socket) => {
      logger.info(`User connected: ${socket.id}`);

      // User joins their own room (based on user ID)
      socket.on('join', (userId) => {
        socket.join(userId);
        logger.info(`User ${userId} joined room`);
      });

      // Handle message sending
      socket.on('message', async ({ senderId, receiverId, content }) => {
        try {
          if (!senderId || !receiverId || !content) {
            socket.emit('error', { message: 'Sender ID, receiver ID, and content are required' });
            return;
          }

          // Store message in database
          const message = await Message.create({
            sender_id: senderId,
            receiver_id: receiverId,
            content,
          });

          // Log audit event
          await logAudit(senderId, 'send_message', `Message sent to user ${receiverId}`, null, {
            ip: socket.handshake.address,
            get: (header) => socket.handshake.headers[header.toLowerCase()],
          });

          // Emit message to sender and receiver
          io.to(senderId).emit('message', message);
          io.to(receiverId).emit('message', message);
        } catch (err) {
          logger.error(`Message sending failed: ${err.message}`);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      socket.on('disconnect', () => {
        logger.info(`User disconnected: ${socket.id}`);
      });
    });
  },

  emit(userId, event, data) {
    if (io) {
      io.to(userId).emit(event, data);
    } else {
      logger.error('Socket.IO not initialized');
    }
  },
};

module.exports = socketService;