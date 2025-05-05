// backend/controllers/ratingController.js
const Rating = require('../models/rating');
const { logAudit } = require('../utils/auditLogger');
const logger = require('../config/logger');

const ratingController = {
  async submit(req, res, next) {
    try {
      const { ratee_id, rating, review } = req.body;
      const rater_id = req.user.id;

      // Validate inputs
      if (!ratee_id || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Ratee ID and valid rating (1-5) are required' });
      }

      // Create rating
      const ratingRecord = await Rating.create({ rater_id, ratee_id, rating, review });

      // Log audit event
      await logAudit(rater_id, 'submit_rating', `Rating submitted for user: ${ratee_id}`, null, req);

      res.status(201).json(ratingRecord);
    } catch (err) {
      logger.error(`Rating submission failed: ${err.message}`);
      next(err);
    }
  },

  async getByUserId(req, res, next) {
    try {
      const userId = req.params.user_id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const ratings = await Rating.findByUserId(userId, { limit, offset });

      // Log audit event
      await logAudit(req.user?.id, 'view_ratings', `Viewed ratings for user: ${userId}`, null, req);

      res.json(ratings);
    } catch (err) {
      logger.error(`Rating retrieval failed: ${err.message}`);
      next(err);
    }
  },
};

module.exports = ratingController;