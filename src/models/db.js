// src/models/db.js
const { Pool } = require('pg')
const dotenv    = require('dotenv')
const fs        = require('fs')
const path      = require('path')

dotenv.config()

// Pick up a separate flag for SSL, or just NODE_ENV
const useSSL = process.env.NODE_ENV === 'production'

const sslConfig = useSSL
  ? {
      rejectUnauthorized: true,
      ca: fs.readFileSync(
        path.join(__dirname, '..', 'certs', 'cc-ca.crt'),
        'utf8'
      ),
    }
  : false

console.log('DB SSL config:', sslConfig)

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig,
})

module.exports = {
  query: (text, params) => pool.query(text, params),
}
