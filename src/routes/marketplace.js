// backend/routes/marketplace.js
const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const { logAudit } = require('../utils/auditLogger');
const logger = require('../config/logger');

router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      county,
      minPrice,
      maxPrice,
      qualityRating,
      search,
    } = req.query;
    const offset = (page - 1) * limit;

    // Build query conditions
    let conditions = {};
    if (category) conditions.category_name = category;
    if (county) conditions.county_name = county;
    if (minPrice || maxPrice) {
      conditions.price = {};
      if (minPrice) conditions.price.$gte = parseFloat(minPrice);
      if (maxPrice) conditions.price.$lte = parseFloat(maxPrice);
    }
    if (qualityRating) {
      conditions.ai_quality_grade = { $gte: parseFloat(qualityRating) };
    }
    if (search) {
      conditions.$or = [
        { name: { $like: `%${search}%` } },
        { description: { $like: `%${search}%` } },
      ];
    }

    const products = await Product.findAll({ ...conditions, limit, offset });
    const total = await Product.count(conditions);

    const categories = await Product.getCategories(); // Assume this method exists in your Product model
    const counties = await Product.getCounties(); // Assume this method exists in your Product model

    // Log audit event
    await logAudit(req.user?.id, 'view_marketplace', 'Marketplace viewed', null, req);

    res.json({ products, total, categories, counties });
  } catch (err) {
    logger.error(`Marketplace retrieval failed: ${err.message}`);
    next(err);
  }
});

module.exports = router;