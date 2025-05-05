const { getAuditLogs } = require('../models/auditLog');
const logger = require('../config/logger');

exports.getAuditLogs = async (req, res) => {
  try {
    const filters = {
      userId: req.query.userId,
      action: req.query.action,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      limit: parseInt(req.query.limit) || 100,
      offset: parseInt(req.query.offset) || 0,
    };
    const logs = await getAuditLogs(filters);
    res.json(logs);
  } catch (error) {
    logger.error(`Failed to fetch audit logs: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};