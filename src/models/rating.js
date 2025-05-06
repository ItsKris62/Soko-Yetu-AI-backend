// backend/models/rating.js
const db = require('../config/database');

const Rating = {
  async create(rating) {
    const query = 'INSERT INTO ratings (rater_id, ratee_id, rating, review) VALUES ($1, $2, $3, $4) RETURNING *';
    const values = [rating.rater_id, rating.ratee_id, rating.rating, rating.review];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  async findByUserId(userId, filters) {
    const query = 'SELECT * FROM ratings WHERE ratee_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    const values = [userId, filters.limit, filters.offset];
    const result = await db.query(query, values);
    return result.rows;
  },
};

module.exports = Rating;