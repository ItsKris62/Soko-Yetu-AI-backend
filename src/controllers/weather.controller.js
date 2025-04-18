// src/controllers/weather.controller.js
const axios = require('axios')

/**
 * GET /api/weather/seasonal-forecast?lat=...&lng=...
 * Proxies a request to Weatherbit, then shapes the response
 * into planting season, rainfall prediction, and temperature trend.
 */
exports.getSeasonalForecast = async (req, res) => {
  try {
    const { lat, lng } = req.query
    const apiKey = process.env.WEATHERBIT_API_KEY
    if (!lat || !lng || !apiKey) {
      return res.status(400).json({ message: 'latitude, longitude and WEATHERBIT_API_KEY are required' })
    }

    // Fetch 7‑day forecast from Weatherbit
    const weatherRes = await axios.get('https://api.weatherbit.io/v2.0/forecast/daily', {
      params: { lat, lon: lng, key: apiKey, days: 7 },
    })

    const forecast = weatherRes.data.data  // array of daily entries
    // Simple heuristics for seasonal forecast:
    // - Planting season: months with highest avg rainfall
    // - Rainfall prediction: avg of next 7 days
    // - Temperature trend: min/max of next 7 days
    const rainfallValues = forecast.map((d) => d.precip)
    const tempMaxes = forecast.map((d) => d.max_temp)
    const tempMins = forecast.map((d) => d.min_temp)

    const avgRain = (rainfallValues.reduce((a, b) => a + b, 0) / rainfallValues.length).toFixed(1)
    const minTemp = Math.min(...tempMins).toFixed(1)
    const maxTemp = Math.max(...tempMaxes).toFixed(1)

    // Determine planting window by picking the two months in forecast with highest rain
    const sortedByRain = [...forecast].sort((a, b) => b.precip - a.precip)
    const months = Array.from(new Set(sortedByRain.slice(0, 2).map((d) => new Date(d.valid_date).toLocaleString('default', { month: 'long' }))))
    const plantingSeason = months.join(' – ')

    res.json({
      planting_season: plantingSeason,
      rainfall_prediction: `${avgRain} mm over next week`,
      temperature_trend: `${minTemp}°C – ${maxTemp}°C`,
    })
  } catch (err) {
    console.error('Seasonal forecast error:', err.message)
    res.status(500).json({ message: 'Failed to fetch seasonal forecast' })
  }
}
