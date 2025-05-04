// routes/locations.js
const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

router.get('/countries', locationController.getCountries);
router.get('/counties', locationController.getCounties);
router.get('/sub-counties', locationController.getSubCounties);

module.exports = router;