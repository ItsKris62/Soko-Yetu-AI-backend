// backend/routes/ratings.js
const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, ratingController.submit);
router.get('/:user_id', ratingController.getByUserId);

module.exports = router;