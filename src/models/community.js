// backend/models/community.js
const db = require('../config/database');

const Community = {
  async createPost(post) {
    const query = 'INSERT INTO community_posts (user_id, title, content) VALUES ($1, $2, $3) RETURNING *';
    const values = [post.user_id, post.title, post.content];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  async findAll(filters) {
    const query = 'SELECT * FROM community_posts ORDER BY created_at DESC LIMIT $1 OFFSET $2';
    const values = [filters.limit, filters.offset];
    const result = await db.query(query, values);
    return result.rows;
  },

  async findById(id) {
    const query = 'SELECT * FROM community_posts WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  async update(id, updates) {
    const query = 'UPDATE community_posts SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *';
    const values = [updates.title, updates.content, id];
    const result = await db.query(query, values);
    return result.rows[0];
  },
};

module.exports = Community;