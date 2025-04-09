const express = require('express')
const router = express.Router()
const db = require('../models/db')

// Get all counties
router.get('/counties', async (req, res) => {
  try {
    const result = await db.query('SELECT county_id, county_name FROM counties ORDER BY county_name ASC')
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch counties' })
  }
})

// Get sub-counties by county_id
router.get('/sub-counties/:county_id', async (req, res) => {
  try {
    const { county_id } = req.params
    const result = await db.query(
      'SELECT sub_county_id, sub_county_name FROM sub_counties WHERE county_id = $1 ORDER BY sub_county_name ASC',
      [county_id]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch sub-counties' })
  }
})

// Get county/sub-county from lat/lng
router.post('/reverse-lookup', async (req, res) => {
  try {
    const { latitude, longitude } = req.body
    const point = `SRID=4326;POINT(${longitude} ${latitude})`

    const countyQuery = `
      SELECT county_name FROM counties
      WHERE ST_Contains(geom, ST_GeomFromText($1))
      LIMIT 1;
    `
    const subCountyQuery = `
      SELECT sub_county_name FROM sub_counties
      WHERE ST_Contains(geom, ST_GeomFromText($1))
      LIMIT 1;
    `

    const county = await db.query(countyQuery, [point])
    const subCounty = await db.query(subCountyQuery, [point])

    res.json({
      county: county.rows[0]?.county_name || null,
      sub_county: subCounty.rows[0]?.sub_county_name || null,
    })
  } catch (err) {
    res.status(500).json({ message: 'Reverse lookup failed' })
  }
})

module.exports = router
