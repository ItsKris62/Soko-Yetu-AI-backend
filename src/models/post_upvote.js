// backend/src/models/post_upvote.js
const pool = require('../config/database');

const PostUpvote = {
  async create({ post_id, user_id }) {
    const query = `
      INSERT INTO post_upvotes (post_id, user_id, created_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      RETURNING id, post_id, user_id, created_at
    `;
    const values = [post_id, user_id];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  async exists(post_id, user_id) {
    const query = 'SELECT 1 FROM post_upvotes WHERE post_id = $1 AND user_id = $2';
    const { rows } = await pool.query(query, [post_id, user_id]);
    return rows.length > 0;
  },
};

module.exports = PostUpvote;