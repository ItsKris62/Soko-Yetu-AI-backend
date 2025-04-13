// src/controllers/location.controller.js
const db = require('../models/db');

/**
 * Get all counties from the database.
 * Responds with a JSON array sorted by county name.
 */
exports.getCounties = async (req, res) => {
  try {
    // Query to retrieve counties ordered by name
    const result = await db.query(
      'SELECT county_id, county_name FROM counties ORDER BY county_name ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching counties:', err);
    res.status(500).json({ message: 'Failed to fetch counties' });
  }
};

/**
 * Get all sub-counties for a given county_id.
 * Expects county_id as a URL parameter.
 */
exports.getSubCounties = async (req, res) => {
  try {
    const { county_id } = req.params; // Extract county_id from the URL
    // Query to retrieve sub-counties corresponding to the county_id
    const result = await db.query(
      'SELECT sub_county_id, sub_county_name FROM sub_counties WHERE county_id = $1 ORDER BY sub_county_name ASC',
      [county_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching sub-counties:', err);
    res.status(500).json({ message: 'Failed to fetch sub-counties' });
  }
};

/**
 * Optional: Reverse lookup of county and sub-county based on provided latitude and longitude.
 * Returns the first matching county and sub-county name if found.
 */
exports.reverseLookup = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const point = `SRID=4326;POINT(${longitude} ${latitude})`;
    const countyQuery = `
      SELECT county_name FROM counties
      WHERE ST_Contains(geom, ST_GeomFromText($1))
      LIMIT 1;
    `;
    const subCountyQuery = `
      SELECT sub_county_name FROM sub_counties
      WHERE ST_Contains(geom, ST_GeomFromText($1))
      LIMIT 1;
    `;
    const county = await db.query(countyQuery, [point]);
    const subCounty = await db.query(subCountyQuery, [point]);

    res.json({
      county: county.rows[0]?.county_name || null,
      sub_county: subCounty.rows[0]?.sub_county_name || null,
    });
  } catch (err) {
    console.error('Error in reverse lookup:', err);
    res.status(500).json({ message: 'Reverse lookup failed' });
  }
};
