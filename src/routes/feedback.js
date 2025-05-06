// backend/routes/feedback.js
const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.post('/', authMiddleware, feedbackController.submit);
router.get('/', authMiddleware, roleMiddleware('admin'), feedbackController.getAll);

module.exports = router;