// a test route to confirm that the DB is connected and querying correctly.

import express from 'express'
import db from '../models/db.js'

const router = express.Router()

router.get('/test-connection', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()')
    res.json({ success: true, server_time: result.rows[0] })
  } catch (err) {
    console.error('DB Connection Error:', err)
    res.status(500).json({ success: false, message: 'Database connection failed' })
  }
})

export default router
