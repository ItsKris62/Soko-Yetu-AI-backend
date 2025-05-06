// backend/models/aiInsight.js
const db = require('../config/database');

const AIInsight = {
  async create(insight) {
    const query = `
      INSERT INTO ai_insights (
        product_id, ai_suggested_price, ai_quality_grade, forecasted_yield, confidence_score
      ) VALUES ($1, $2, $3, $4, $5) RETURNING *;
    `;
    const values = [
      insight.product_id,
      insight.ai_suggested_price,
      insight.ai_quality_grade,
      insight.forecasted_yield,
      insight.confidence_score,
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  async findByProductId(productId) {
    const query = 'SELECT * FROM ai_insights WHERE product_id = $1 ORDER BY created_at DESC';
    const result = await db.query(query, [productId]);
    return result.rows;
  },
};

module.exports = AIInsight;