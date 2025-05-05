// backend/controllers/aiController.js
const { getAIInsights, forecastYield } = require('../services/aiService');
const { logAudit } = require('../utils/auditLogger');
const logger = require('../config/logger');

const aiController = {
  async getInsights(req, res, next) {
    try {
      const { product_id, name, description, price, category_id, image_url } = req.body;

      // Validate inputs
      if (!product_id || !name || !category_id) {
        return res.status(400).json({ error: 'Product ID, name, and category ID are required' });
      }

      // Call AI microservice
      const insights = await getAIInsights({ product_id, name, description, price, category_id, image_url });

      // Log audit event
      await logAudit(req.user.id, 'generate_ai_insight', `AI insights generated for product: ${product_id}`, product_id, req);

      res.json(insights);
    } catch (err) {
      logger.error(`AI insights generation failed: ${err.message}`);
      next(err);
    }
  },

  async forecastYield(req, res, next) {
    try {
      const { user_id, category_id, product_id, country_id, county_id, forecast_date } = req.body;

      // Validate inputs
      if (!user_id || !category_id || !country_id || !county_id) {
        return res.status(400).json({ error: 'User ID, category ID, country ID, and county ID are required' });
      }

      // Call AI microservice
      const forecast = await forecastYield({ user_id, category_id, product_id, country_id, county_id, forecast_date });

      // Log audit event
      await logAudit(req.user.id, 'generate_yield_forecast', `Crop yield forecast generated for category: ${category_id}`, product_id, req);

      res.json(forecast);
    } catch (err) {
      logger.error(`Yield forecast failed: ${err.message}`);
      next(err);
    }
  },
};

module.exports = aiController;