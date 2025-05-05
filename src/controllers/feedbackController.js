// backend/controllers/feedbackController.js
const Feedback = require('../models/feedback');
const { logAudit } = require('../utils/auditLogger');
const logger = require('../config/logger');

const feedbackController = {
  async submit(req, res, next) {
    try {
      const { feedback } = req.body;
      const user_id = req.user.id;

      // Validate inputs
      if (!feedback) {
        return res.status(400).json({ error: 'Feedback is required' });
      }

      // Create feedback
      const feedbackRecord = await Feedback.create({ user_id, feedback });

      // Log audit event
      await logAudit(user_id, 'submit_feedback', 'Feedback submitted', null, req);

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