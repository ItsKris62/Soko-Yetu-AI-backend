// backend/models/category.js
const pool = require('../config/database'); // Use pool for consistency

const Category = {
  async create(category) {
    const query = 'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *';
    const values = [category.name, category.description];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async findAll() {
    const query = 'SELECT * FROM categories ORDER BY name ASC'; // Order by name for better UX
    const result = await pool.query(query);
    return result.rows;
  },

  async findById(id) {
    const query = 'SELECT * FROM categories WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  async update(id, updates) {
    const query = 'UPDATE categories SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *';
    const values = [updates.name, updates.description, id];
    const result = await pool.query(query, values);
    return result.rows[0];
  },
};

module.exports = Category;