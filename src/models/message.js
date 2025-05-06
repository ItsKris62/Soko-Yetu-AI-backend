// backend/models/message.js
const db = require('../config/database');

const Message = {
  async create(message) {
    const query = 'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *';
    const values = [message.sender_id, message.receiver_id, message.content];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  async findAll(filters) {
    const query = `
      SELECT * FROM messages
      WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
      ORDER BY created_at ASC
    `;
    const values = [filters.sender_id, filters.receiver_id];
    const result = await db.query(query, values);
    return result.rows;
  },
};

module.exports = Message;