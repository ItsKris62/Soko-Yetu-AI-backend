// src/routes/location.routes.js
const express = require('express');
const router = express.Router();

const locationController = require('../controllers/location.controller');

// Get all counties
router.get('/counties', locationController.getCounties);

// Get sub-counties filtered by county_id
router.get('/sub-counties/:county_id', locationController.getSubCounties);

// (Optional) Reverse lookup based on lat/lng
router.post('/reverse-lookup', locationController.reverseLookup);

module.exports = router;
