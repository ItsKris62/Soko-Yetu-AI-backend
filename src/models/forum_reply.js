// backend/src/models/forum_reply.js
const pool = require('../config/database');

const ForumReply = {
  async create({ post_id, user_id, content }) {
    const query = `
      INSERT INTO forum_replies (post_id, user_id, content, created_at, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, post_id, user_id, content, created_at, updated_at
    `;
    const values = [post_id, user_id, content];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  async findAllByPostId({ post_id, limit = 10, offset = 0 }) {
    const query = `
      SELECT fr.id, fr.post_id, fr.user_id, fr.content, fr.created_at, fr.updated_at,
             u.first_name, u.last_name
      FROM forum_replies fr
      JOIN users u ON fr.user_id = u.id
      WHERE fr.post_id = $1
      ORDER BY fr.created_at ASC
      LIMIT $2 OFFSET $3
    `;
    const values = [post_id, limit, offset];
    const { rows } = await pool.query(query, values);
    return rows;
  },

  async countByPostId(post_id) {
    const query = 'SELECT COUNT(*) FROM forum_replies WHERE post_id = $1';
    const { rows } = await pool.query(query, [post_id]);
    return parseInt(rows[0].count);
  },
};

module.exports = ForumReply;