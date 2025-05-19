// backend/models/feedback.js
const db = require('../config/database');

const Feedback = {
  async create({ user_id, feedback, name }) { // Destructure name here
    const query = 'INSERT INTO feedback (user_id, feedback, name) VALUES ($1, $2, $3) RETURNING *'; // Add name to query
    const values = [user_id, feedback, name]; // Add name to values
    const result = await db.query(query, values);
    return result.rows[0];
  },

  async findAll(filters) {
    const query = 'SELECT * FROM feedback ORDER BY created_at DESC LIMIT $1 OFFSET $2';
    const values = [filters.limit, filters.offset];
    const result = await db.query(query, values);
    return result.rows;
  },
};

module.exports = Feedback;
