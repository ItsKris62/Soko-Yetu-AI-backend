// controllers/productController.js
const Product = require('../models/product');
const PredefinedProduct = require('../models/predefined_product');
const cloudinaryService = require('../services/cloudinaryService');
const aiService = require('../services/aiService');
const { logAudit } = require('../utils/auditLogger');
const logger = require('../config/logger');

const productController = {
  async create(req, res, next) {
    try {
      const { predefined_product_id, description, price, country_id, county_id, category_id } = req.body;
      const farmer_id = req.user.id;

      if (!predefined_product_id || !price || !country_id || !category_id) {
        return res.status(400).json({ error: 'Predefined product, price, country_id, and category_id are required' });
      }

      const predefinedProduct = await PredefinedProduct.findById(predefined_product_id);
      if (!predefinedProduct) {
        return res.status(400).json({ error: 'Invalid predefined product' });
      }
      if (predefinedProduct.category_id.toString() !== category_id.toString()) {
        return res.status(400).json({ error: 'Category does not match the predefined product' });
      }

      const image_url = req.file ? await cloudinaryService.upload(req.file) : null;

      const aiData = await aiService.predictPrice({ name: predefinedProduct.name, description, price, category_id });
      const ai_suggested_price = aiData.price;
      const ai_quality_grade = image_url ? (await aiService.analyzeCrop(image_url)).grade : null;

      const product = await Product.create({
        farmer_id,
        predefined_product_id,
        category_id,
        description,
        price,
        image_url,
        country_id,
        county_id,
        ai_suggested_price,
        ai_quality_grade,
      });

      product.product_name = predefinedProduct.name;
      product.category_name = predefinedProduct.category_name;

      await logAudit(farmer_id, 'create_product', `Product created: ${predefinedProduct.name}`, product.id, req);

      res.status(201).json(product);
    } catch (err) {
      logger.error(`Product creation failed: ${err.message}`);
      next(err);
    }
  },

  async getAll(req, res, next) {
    try {
      const {
        category_id,
        country_id,
        county_id,
        page = 1,
        limit = 10,
        minPrice,
        maxPrice,
        qualityRating,
        searchQuery,
      } = req.query;
      const offset = (page - 1) * limit;

      const filters = {};
      if (category_id) filters.category_id = parseInt(category_id);
      if (country_id) filters.country_id = parseInt(country_id);
      if (county_id) filters.county_id = parseInt(county_id);
      if (minPrice || maxPrice) {
        filters.price = {};
        if (minPrice) filters.price.$gte = parseFloat(minPrice);
        if (maxPrice) filters.price.$lte = parseFloat(maxPrice);
      }
      if (qualityRating) {
        filters.ai_quality_grade = { $gte: parseFloat(qualityRating) };
      }
      if (searchQuery) {
        const searchTerm = `%${searchQuery}%`;
        filters.$or = [
          { name: { $like: searchTerm } },
          { description: { $like: searchTerm } },
        ];
      }

      const products = await Product.findAll({ ...filters, limit: parseInt(limit), offset });
      const total = await Product.count(filters);

      await logAudit(req.user?.id, 'view_products', 'Product list viewed', null, req);

      res.json({ products, total });
    } catch (err) {
      logger.error(`Product retrieval failed: ${err.message}`);
      next(err);
    }
  },

  async getSuggestions(req, res, next) {
    try {
      const { query } = req.query;
      if (!query) {
        return res.json([]);
      }

      const suggestions = await PredefinedProduct.findSuggestions(query);

      res.json(suggestions);
    } catch (err) {
      logger.error(`Product suggestions retrieval failed: ${err.message}`);
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      await logAudit(req.user?.id, 'view_product', `Product viewed: ${product.id}`, product.id, req);

      res.json(product);
    } catch (err) {
      logger.error(`Product retrieval failed: ${err.message}`);
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { predefined_product_id, description, price, country_id, county_id, category_id } = req.body;
      const productId = req.params.id;
      const farmer_id = req.user.id;

      if (!predefined_product_id || !price || !country_id || !category_id) {
        return res.status(400).json({ error: 'Predefined product, price, country_id, and category_id are required' });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      if (product.farmer_id !== farmer_id) {
        return res.status(403).json({ error: 'Unauthorized to update this product' });
      }

      const predefinedProduct = await PredefinedProduct.findById(predefined_product_id);
      if (!predefinedProduct) {
        return res.status(400).json({ error: 'Invalid predefined product' });
      }
      if (predefinedProduct.category_id.toString() !== category_id.toString()) {
        return res.status(400).json({ error: 'Category does not match the predefined product' });
      }

      const image_url = req.file ? await cloudinaryService.upload(req.file) : product.image_url;

      const aiData = await aiService.predictPrice({ name: predefinedProduct.name, description, price, category_id });
      const ai_suggested_price = aiData.price;
      const ai_quality_grade = image_url ? (await aiService.analyzeCrop(image_url)).grade : product.ai_quality_grade;

      const updatedProduct = await Product.update(productId, {
        predefined_product_id,
        category_id,
        description,
        price,
        image_url,
        country_id,
        county_id,
        ai_suggested_price,
        ai_quality_grade,
      });

      updatedProduct.product_name = predefinedProduct.name;
      updatedProduct.category_name = predefinedProduct.category_name;

      await logAudit(farmer_id, 'update_product', `Product updated: ${predefinedProduct.name}`, productId, req);

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

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      if (product.farmer_id !== farmer_id) {
        return res.status(403).json({ error: 'Unauthorized to delete this product' });
      }

      await Product.delete(productId);

      await logAudit(farmer_id, 'delete_product', `Product deleted: ${product.product_name}`, productId, req);

      res.json({ message: 'Product deleted successfully' });
    } catch (err) {
      logger.error(`Product deletion failed: ${err.message}`);
      next(err);
    }
  },
};

module.exports = productController;