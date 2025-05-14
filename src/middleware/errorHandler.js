// middleware/errorHandler.js
// const { logger } = require('../config/logger'); // Assuming Winston logger setup

const loggerInstance = require('../config/logger'); // Renamed to avoid conflict if logger is not an object with an error method


const errorHandler = (err, req, res, next) => {
  // Log the error for debugging
  if (loggerInstance && typeof loggerInstance.error === 'function') {
    loggerInstance.error({
      message: err.message || 'Error message not available',
      stack: err.stack || 'Stack trace not available',
      status: err.status || err.statusCode || 500,
      method: req.method,
      url: req.originalUrl, // Use originalUrl for the full path
      ip: req.ip,
    });
  } else {
    // Fallback if logger is not available or not configured as expected
    console.error("ERROR HANDLER FALLBACK - Logger not available or logger.error is not a function.");
    console.error("Original Error Status:", err.status || err.statusCode || 500);
    console.error("Original Error Message:", err.message);
    console.error("Original Error Stack:", err.stack);
  }

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