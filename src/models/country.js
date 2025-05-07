// Example: backend/models/country.js
const db = require('../config/database');

const Country = {
  async findAll() {
    const query = 'SELECT * FROM countries';
    const result = await db.query(query);
    return result.rows;
  },

  async findById(id) {
    const query = 'SELECT * FROM countries WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  },
};

module.exports = Country;