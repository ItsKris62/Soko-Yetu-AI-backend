const { logAudit } = require('../utils/auditLogger');

module.exports = (req, res, next) => {
  const userId = req.user ? req.user.id : null;
  const action = `http_request_${req.method.toLowerCase()}`;
  const details = `Request to ${req.originalUrl}`;

  logAudit(userId, action, details, null, req);
  next();
};