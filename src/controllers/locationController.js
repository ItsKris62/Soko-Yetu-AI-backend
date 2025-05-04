// controllers/locationController.js
const Location = require('../models/location');

const locationController = {
  async getCountries(req, res, next) {
    try {
      const countries = await Location.getCountries();
      res.json(countries);
    } catch (err) {
      next(err);
    }
  },

  async getCounties(req, res, next) {
    try {
      const { country_id } = req.query;
      if (!country_id) {
        return res.status(400).json({ error: 'country_id is required' });
      }
      const counties = await Location.getCounties(country_id);
      res.json(counties);
    } catch (err) {
      next(err);
    }
  },

  async getSubCounties(req, res, next) {
    try {
      const { county_id } = req.query;
      if (!county_id) {
        return res.status(400).json({ error: 'county_id is required' });
      }
      const subCounties = await Location.getSubCounties(county_id);
      res.json(subCounties);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = locationController;