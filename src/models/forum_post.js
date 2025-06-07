// backend/src/models/forum_post.js
const pool = require('../config/database');

const ForumPost = {
  async create({ user_id, title, content, category }) {
    const query = `
      INSERT INTO forum_posts (user_id, title, content, category, upvote_count, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, user_id, title, content, category, upvote_count, created_at, updated_at
    `;
    const values = [user_id, title, content, category];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  async findAll({ category, search, limit = 10, offset = 0 }) {
    let query = `
      SELECT fp.id, fp.user_id, fp.title, fp.content, fp.category, fp.upvote_count, fp.created_at, fp.updated_at,
             u.first_name, u.last_name,
             (SELECT COUNT(*) FROM forum_replies fr WHERE fr.post_id = fp.id) as reply_count
      FROM forum_posts fp
      JOIN users u ON fp.user_id = u.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (category) {
      query += ` AND fp.category = $${paramCount++}`;
      values.push(category);
    }
    if (search) {
      query += ` AND (fp.title ILIKE $${paramCount} OR fp.content ILIKE $${paramCount++})`;
      values.push(`%${search}%`);
    }

    query += ` ORDER BY fp.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    values.push(limit, offset);

    const { rows } = await pool.query(query, values);
    return rows;
  },

  async count({ category, search }) {
    let query = 'SELECT COUNT(*) FROM forum_posts WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (category) {
      query += ` AND category = $${paramCount++}`;
      values.push(category);
    }
    if (search) {
      query += ` AND (title ILIKE $${paramCount} OR content ILIKE $${paramCount++})`;
      values.push(`%${search}%`);
    }

    const { rows } = await pool.query(query, values);
    return parseInt(rows[0].count);
  },

  async findById(id) {
    const query = `
      SELECT fp.id, fp.user_id, fp.title, fp.content, fp.category, fp.upvote_count, fp.created_at, fp.updated_at,
             u.first_name, u.last_name,
             (SELECT COUNT(*) FROM forum_replies fr WHERE fr.post_id = fp.id) as reply_count
      FROM forum_posts fp
      JOIN users u ON fp.user_id = u.id
      WHERE fp.id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  },

  async incrementUpvoteCount(post_id) {
    const query = `
      UPDATE forum_posts
      SET upvote_count = upvote_count + 1
      WHERE id = $1
      RETURNING upvote_count
    `;
    const { rows } = await pool.query(query, [post_id]);
    return rows[0].upvote_count;
  },
};

module.exports = ForumPost;