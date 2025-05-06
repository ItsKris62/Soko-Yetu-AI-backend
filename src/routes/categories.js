// backend/routes/categories.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/', categoryController.getAll);
router.post('/', authMiddleware, roleMiddleware('admin'), categoryController.create);
router.put('/:id', authMiddleware, roleMiddleware('admin'), categoryController.update);

module.exports = router;