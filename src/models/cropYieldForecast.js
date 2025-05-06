// backend/models/cropYieldForecast.js
const db = require('../config/database');

const CropYieldForecast = {
  async create(forecast) {
    const query = `
      INSERT INTO crop_yield_forecasts (
        user_id, product_id, category_id, forecasted_yield, confidence_score, forecast_date
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
    `;
    const values = [
      forecast.user_id,
      forecast.product_id,
      forecast.category_id,
      forecast.forecasted_yield,
      forecast.confidence_score,
      forecast.forecast_date,
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  async findByUserId(userId, filters) {
    const query = 'SELECT * FROM crop_yield_forecasts WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    const values = [userId, filters.limit, filters.offset];
    const result = await db.query(query, values);
    return result.rows;
  },
};

module.exports = CropYieldForecast;