// backend/controllers/feedbackController.js
const Feedback = require('../models/feedback');
const { logAudit } = require('../utils/auditLogger');
const logger = require('../config/logger');

const feedbackController = {
  async submit(req, res, next) {
    try {
      const { feedback, name, user_id } = req.body; // Extract name and user_id from body

      // Validate inputs
      if (!feedback) {
        return res.status(400).json({ error: 'Feedback is required' });
      }
      // The frontend form makes 'name' required, so it should generally be present.
      // You could add a specific validation for name if it can be optional under some conditions.
      // if (!name) {
      //   return res.status(400).json({ error: 'Name is required' });
      // }

      // Create feedback
      const feedbackData = {
        user_id, // This comes from the frontend, can be null for anonymous users
        name,
        feedback,
      };
      const feedbackRecord = await Feedback.create(feedbackData);

      // Log audit event
      const auditUserId = req.user ? req.user.id : (user_id || 'anonymous_user');
      await logAudit(auditUserId, 'submit_feedback', `Feedback submitted by ${name || 'anonymous'}`, { feedbackId: feedbackRecord.id }, req);

      res.status(201).json(feedbackRecord);
    } catch (err) {
      logger.error(`Feedback submission failed: ${err.message}`);
      next(err);
    }
  },

  async getAll(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const feedbackRecords = await Feedback.findAll({ limit, offset });

      // Log audit event
      await logAudit(req.user.id, 'view_feedback', 'Viewed feedback list', null, req);

      res.json(feedbackRecords);
    } catch (err) {
      logger.error(`Feedback retrieval failed: ${err.message}`);
      next(err);
    }
  },
};

module.exports = feedbackController;