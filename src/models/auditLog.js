const db = require('../config/database');

exports.createAuditLog = async (userId, action, details, productId = null) => {
  const query = `
    INSERT INTO audit_logs (user_id, action, details, product_id, created_at)
    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
    RETURNING *;
  `;
  const values = [userId, action, details, productId];
  const result = await db.query(query, values);
  return result.rows[0];
};

exports.getAuditLogs = async (filters = {}) => {
  const { userId, action, startDate, endDate, limit = 100, offset = 0 } = filters;
  let query = 'SELECT * FROM audit_logs WHERE 1=1';
  const values = [];
  let paramIndex = 1;

  if (userId) {
    query += ` AND user_id = $${paramIndex++}`;
    values.push(userId);
  }
  if (action) {
    query += ` AND action = $${paramIndex++}`;
    values.push(action);
  }
  if (startDate) {
    query += ` AND created_at >= $${paramIndex++}`;
    values.push(startDate);
  }
  if (endDate) {
    query += ` AND created_at <= $${paramIndex++}`;
    values.push(endDate);
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  values.push(limit, offset);

  const result = await db.query(query, values);
  return result.rows;
};