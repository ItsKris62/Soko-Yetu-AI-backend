// controllers/productController.js
const Product = require('../models/product');
const cloudinaryService = require('../services/cloudinaryService');
const aiService = require('../services/aiService');
const { auditLogger } = require('../utils/auditLogger');

const productController = {
  async create(req, res, next) {
    try {
      const { name, description, price, country_id, county_id, category_id } = req.body;
      const farmer_id = req.user.id;

      // Validate inputs
      if (!name || !price || !country_id || !category_id) {
        return res.status(400).json({ error: 'Name, price, country_id, and category_id are required' });
      }

      // Handle image upload
      const image_url = req.file ? await cloudinaryService.upload(req.file) : null;

      // Call AI microservice for insights
      const aiData = await aiService.predictPrice({ name, description, price, category_id });
      const ai_suggested_price = aiData.price;
      const ai_quality_grade = image_url ? (await aiService.analyzeCrop(image_url)).grade : null;

      // Create product
      const product = await Product.create({
        farmer_id,
        name,
        description,
        price,
        image_url,
        country_id,
        county_id,
        category_id,
        ai_suggested_price,
        ai_quality_grade,
      });

      // Log audit event
      await auditLogger(farmer_id, 'CREATE_PRODUCT', `Product created: ${name}`, product.id, req.ip);

      res.status(201).json(product);
    } catch (err) {
      next(err);
    }
  },

  async getAll(req, res, next) {
    try {
      const { category_id, country_id, county_id, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const products = await Product.findAll({ category_id, country_id, county_id, limit, offset });
      res.json(products);
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(product);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = productController;