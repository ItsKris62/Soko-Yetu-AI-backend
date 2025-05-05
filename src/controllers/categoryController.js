// backend/controllers/categoryController.js
const Category = require('../models/category');
const { logAudit } = require('../utils/auditLogger');
const logger = require('../config/logger');

const categoryController = {
  async getAll(req, res, next) {
    try {
      const categories = await Category.findAll();

      // Log audit event
      await logAudit(req.user?.id, 'view_categories', 'Viewed category list', null, req);

      res.json(categories);
    } catch (err) {
      logger.error(`Category retrieval failed: ${err.message}`);
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const { name, description } = req.body;

      // Validate inputs
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      // Create category
      const category = await Category.create({ name, description });

      // Log audit event
      await logAudit(req.user.id, 'create_category', `Category created: ${name}`, null, req);

      res.status(201).json(category);
    } catch (err) {
      logger.error(`Category creation failed: ${err.message}`);
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const categoryId = req.params.id;
      const { name, description } = req.body;

      // Validate inputs
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      // Update category
      const updatedCategory = await Category.update(categoryId, { name, description });

      // Log audit event
      await logAudit(req.user.id, 'update_category', `Category updated: ${name}`, null, req);

      res.json(updatedCategory);
    } catch (err) {
      logger.error(`Category update failed: ${err.message}`);
      next(err);
    }
  },
};

module.exports = categoryController;