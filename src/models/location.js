// models/location.js
const pool = require('../config/database');

const Location = {
  async getCountries() {
    const query = 'SELECT id, name FROM countries ORDER BY name';
    const { rows } = await pool.query(query);
    return rows;
  },

  async getCounties(country_id) {
    const query = 'SELECT id, name FROM counties WHERE country_id = $1 ORDER BY name';
    const { rows } = await pool.query(query, [country_id]);
    return rows;
  },

  async getSubCounties(county_id) {
    const query = 'SELECT id, name FROM sub_counties WHERE county_id = $1 ORDER BY name';
    const { rows } = await pool.query(query, [county_id]);
    return rows;
  },
};

module.exports = Location;