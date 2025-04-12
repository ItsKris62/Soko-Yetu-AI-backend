// db.js using CommonJS
const pg = require("pg");
const dotenv = require("dotenv");

dotenv.config();

// pool for automatic pooling with the DB
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // For CockroachDB TLS
  },
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
