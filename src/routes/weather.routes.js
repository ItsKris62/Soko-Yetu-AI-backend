// src/routes/weather.routes.js
const express = require('express')
const router = express.Router()
const weatherController = require('../controllers/weather.controller')

// Seasonal forecast via Weatherbit
router.get('/seasonal-forecast', weatherController.getSeasonalForecast)

module.exports = router
