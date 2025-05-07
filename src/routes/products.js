// routes/products.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', authMiddleware, roleMiddleware(['farmer']), upload.single('image'), productController.create);
router.get('/', productController.getAll);
router.get('/:id', productController.getById);

module.exports = router;