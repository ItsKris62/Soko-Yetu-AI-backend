// backend/src/models/resource.js
const pool = require('../config/database');

const Resource = {
  async findAll({ type, role, limit = 10, offset = 0 }) {
    let query = `
      SELECT id, title, description, type, url, category, target_role, created_at
      FROM resources
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (type) {
      query += ` AND type = $${paramCount++}`;
      values.push(type);
    }
    if (role) {
      query += ` AND (target_role = $${paramCount++} OR target_role IS NULL)`;
      values.push(role);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    values.push(limit, offset);

    const { rows } = await pool.query(query, values);
    return rows;
  },

  async count({ type, role }) {
    let query = 'SELECT COUNT(*) FROM resources WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (type) {
      query += ` AND type = $${paramCount++}`;
      values.push(type);
    }
    if (role) {
      query += ` AND (target_role = $${paramCount++} OR target_role IS NULL)`;
      values.push(role);
    }

    const { rows } = await pool.query(query, values);
    return parseInt(rows[0].count);
  },
};

module.exports = Resource;