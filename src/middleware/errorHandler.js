// middleware/errorHandler.js
const { logger } = require('../config/logger'); // Assuming Winston logger setup

const errorHandler = (err, req, res, next) => {
  // Log the error for debugging
  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.message,
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      details: 'Invalid or missing JWT token',
    });
  }

  if (err.code === '23505') {
    // PostgreSQL/CockroachDB unique constraint violation
    return res.status(400).json({
      error: 'Database Error',
      details: 'Duplicate entry detected (e.g., email or phone number already exists)',
    });
  }

  // Generic error response
  res.status(err.status || 500).json({
    error: 'Server Error',
    details: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
  });
};

module.exports = { errorHandler };