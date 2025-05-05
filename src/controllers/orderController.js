// backend/controllers/orderController.js
const Order = require('../models/order');
const { logAudit } = require('../utils/auditLogger');
const logger = require('../config/logger');

const orderController = {
  async create(req, res, next) {
    try {
      const { product_id, quantity } = req.body;
      const buyer_id = req.user.id;

      // Validate inputs
      if (!product_id || !quantity || quantity <= 0) {
        return res.status(400).json({ error: 'Product ID and valid quantity are required' });
      }

      // Create order
      const order = await Order.create({ buyer_id, product_id, quantity });

      // Log audit event
      await logAudit(buyer_id, 'create_order', `Order created for product: ${product_id}`, product_id, req);

      res.status(201).json(order);
    } catch (err) {
      logger.error(`Order creation failed: ${err.message}`);
      next(err);
    }
  },

  async getAll(req, res, next) {
    try {
      const userId = req.user.id;
      const { role } = req.query; // Filter by role (buyer or farmer)
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const orders = await Order.findAll({ userId, role, limit, offset });

      // Log audit event
      await logAudit(userId, 'view_orders', 'Viewed order list', null, req);

      res.json(orders);
    } catch (err) {
      logger.error(`Order retrieval failed: ${err.message}`);
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const orderId = req.params.id;
      const { status } = req.body;

      // Validate inputs
      if (!status || !['pending', 'shipped', 'delivered', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Valid status is required (pending, shipped, delivered, cancelled)' });
      }

      // Update order
      const updatedOrder = await Order.update(orderId, { status });

      // Log audit event
      await logAudit(req.user.id, 'update_order', `Order status updated: ${status}`, updatedOrder.product_id, req);

      res.json(updatedOrder);
    } catch (err) {
      logger.error(`Order update failed: ${err.message}`);
      next(err);
    }
  },
};

module.exports = orderController;