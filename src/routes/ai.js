// backend/routes/ai.js
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/insights', authMiddleware, aiController.getInsights);
router.post('/forecast-yield', authMiddleware, aiController.forecastYield);

module.exports = router;