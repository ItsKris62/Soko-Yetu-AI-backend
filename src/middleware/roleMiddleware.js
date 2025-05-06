// backend/middleware/roleMiddleware.js
const db = require('../config/database');
const { logAudit } = require('../utils/auditLogger');
const logger = require('../config/logger');

const roleMiddleware = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id; // From authMiddleware

      // Query user roles
      const query = `
        SELECT r.name
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = $1
      `;
      const result = await db.query(query, [userId]);
      const userRoles = result.rows.map((row) => row.name);

      // Check if user has any of the allowed roles
      const hasPermission = allowedRoles.some((role) => userRoles.includes(role));
      if (!hasPermission) {
        // Log unauthorized access attempt
        await logAudit(userId, 'unauthorized_access', `User attempted to access restricted endpoint: ${req.originalUrl}`, null, req);
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (err) {
      logger.error(`Role middleware error: ${err.message}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

module.exports = roleMiddleware;