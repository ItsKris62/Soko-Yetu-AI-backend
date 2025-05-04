// This file sets up the database connection using pg-promise and CockroachDB

// config/database.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for CockroachDB
  },
});

pool.on('connect', () => {
  console.log('Connected to CockroachDB');
});

pool.on('error', (err) => {
  console.error('Database error:', err.stack);
});

module.exports = pool;