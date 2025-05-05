// controllers/productController.js
const Product = require('../models/product');
const cloudinaryService = require('../services/cloudinaryService');
const aiService = require('../services/aiService');
const { logAudit } = require('../utils/auditLogger');
const logger = require('../config/logger');

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
      await logAudit(farmer_id, 'create_product', `Product created: ${name}`, product.id, req);

      res.status(201).json(product);
    } catch (err) {
      logger.error(`Product creation failed: ${err.message}`);
      next(err);
    }
  },

  async getAll(req, res, next) {
    try {
      const { category_id, country_id, county_id, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const products = await Product.findAll({ category_id, country_id, county_id, limit, offset });

      // Log audit event
      await logAudit(req.user?.id, 'view_products', 'Product list viewed', null, req);

      res.json(products);
    } catch (err) {
      logger.error(`Product retrieval failed: ${err.message}`);
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Log audit event
      await logAudit(req.user?.id, 'view_product', `Product viewed: ${product.id}`, product.id, req);

      res.json(product);
    } catch (err) {
      logger.error(`Product retrieval failed: ${err.message}`);
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { name, description, price, country_id, county_id, category_id } = req.body;
      const productId = req.params.id;
      const farmer_id = req.user.id;

      // Validate inputs
      if (!name || !price || !country_id || !category_id) {
        return res.status(400).json({ error: 'Name, price, country_id, and category_id are required' });
      }

      // Check if product exists and belongs to the farmer
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      if (product.farmer_id !== farmer_id) {
        return res.status(403).json({ error: 'Unauthorized to update this product' });
      }

      // Handle image upload
      const image_url = req.file ? await cloudinaryService.upload(req.file) : product.image_url;

      // Call AI microservice for updated insights
      const aiData = await aiService.predictPrice({ name, description, price, category_id });
      const ai_suggested_price = aiData.price;
      const ai_quality_grade = image_url ? (await aiService.analyzeCrop(image_url)).grade : product.ai_quality_grade;

      // Update product
      const updatedProduct = await Product.update(productId, {
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
      await logAudit(farmer_id, 'update_product', `Product updated: ${name}`, productId, req);

      res.json(updatedProduct);
    } catch (err) {
      logger.error(`Product update failed: ${err.message}`);
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const productId = req.params.id;
      const farmer_id = req.user.id;

      // Check if product exists and belongs to the farmer
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      if (product.farmer_id !== farmer_id) {
        return res.status(403).json({ error: 'Unauthorized to delete this product' });
      }

      // Delete product
      await Product.delete(productId);

      // Log audit event
      await logAudit(farmer_id, 'delete_product', `Product deleted: ${product.name}`, productId, req);

      res.json({ message: 'Product deleted successfully' });
    } catch (err) {
      logger.error(`Product deletion failed: ${err.message}`);
      next(err);
    }
  },
};

module.exports = productController;