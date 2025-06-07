// backend/src/models/notification.js
const pool = require('../config/database');

const Notification = {
  async create({ user_id, type, reference_id, message }) {
    const query = `
      INSERT INTO notifications (user_id, type, reference_id, message, read, created_at)
      VALUES ($1, $2, $3, $4, FALSE, CURRENT_TIMESTAMP)
      RETURNING id, user_id, type, reference_id, message, read, created_at
    `;
    const values = [user_id, type, reference_id, message];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  async findByUserId(user_id, limit = 10, offset = 0) {
    const query = `
      SELECT id, user_id, type, reference_id, message, read, created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const values = [user_id, limit, offset];
    const { rows } = await pool.query(query, values);
    return rows;
  },

  async markAsRead(notification_id) {
    const query = `
      UPDATE notifications
      SET read = TRUE
      WHERE id = $1
      RETURNING id, read
    `;
    const { rows } = await pool.query(query, [notification_id]);
    return rows[0];
  },
};

module.exports = Notification;