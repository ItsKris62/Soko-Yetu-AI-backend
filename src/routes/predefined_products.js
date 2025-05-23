// routes/predefined_products.js
const express = require('express');
const router = express.Router();
const PredefinedProduct = require('../models/predefined_product');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/', async (req, res, next) => {
  try {
    const { categoryId } = req.query;
    const products = categoryId
      ? await PredefinedProduct.findByCategoryId(categoryId)
      : await PredefinedProduct.findAll();
    res.json(products);
  } catch (err) {
    next(err);
  }
});

router.post('/', authMiddleware, roleMiddleware('admin'), async (req, res, next) => {
  try {
    const product = await PredefinedProduct.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

module.exports = router;