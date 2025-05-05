// backend/controllers/messageController.js
const Message = require('../models/message');
const { logAudit } = require('../utils/auditLogger');
const logger = require('../config/logger');

const messageController = {
  async getMessages(req, res, next) {
    try {
      const { receiver_id } = req.query;
      const sender_id = req.user.id;

      // Validate inputs
      if (!receiver_id) {
        return res.status(400).json({ error: 'Receiver ID is required' });
      }

      // Fetch message history
      const messages = await Message.findAll({ sender_id, receiver_id });

      // Log audit event
      await logAudit(sender_id, 'view_messages', `Viewed message history with user: ${receiver_id}`, null, req);

      res.json(messages);
    } catch (err) {
      logger.error(`Message retrieval failed: ${err.message}`);
      next(err);
    }
  },
};

module.exports = messageController;