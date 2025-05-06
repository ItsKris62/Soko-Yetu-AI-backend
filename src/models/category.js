// backend/models/category.js
const db = require('../config/database');

const Category = {
  async create(category) {
    const query = 'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *';
    const values = [category.name, category.description];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  async findAll() {
    const query = 'SELECT * FROM categories ORDER BY created_at DESC';
    const result = await db.query(query);
    return result.rows;
  },

  async update(id, updates) {
    const query = 'UPDATE categories SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *';
    const values = [updates.name, updates.description, id];
    const result = await db.query(query, values);
    return result.rows[0];
  },
};

module.exports = Category;