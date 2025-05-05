const { createAuditLog } = require('../models/auditLog');

exports.logAudit = async (userId, action, details, productId = null, req = null) => {
  try {
    // Enhance details with request metadata if available
    let enhancedDetails = details;
    if (req) {
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');
      enhancedDetails = JSON.stringify({
        message: details,
        ip,
        userAgent,
        timestamp: new Date().toISOString(),
      });
    }

    await createAuditLog(userId, action, enhancedDetails, productId);
  } catch (error) {
    console.error('Failed to log audit event:', error.message);
  }
};