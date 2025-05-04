// utils/auditLogger.js
const pool = require('../config/database');

const auditLogger = async (user_id, action, details, product_id, ip) => {
  await pool.query(
    'INSERT INTO audit_logs (user_id, action, details, product_id, created_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)',
    [user_id, action, details, product_id]
  );
};

module.exports = { auditLogger };