// middleware/roleMiddleware.js
const pool = require('../config/database');

const roleMiddleware = (roles) => async (req, res, next) => {
  try {
    const userId = req.user.id;
    const query = `
      SELECT r.name
      FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = $1
    `;
    const { rows } = await pool.query(query, [userId]);
    const userRoles = rows.map((row) => row.name);

    const hasRole = roles.some((role) => userRoles.includes(role));
    if (!hasRole) {
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { roleMiddleware };