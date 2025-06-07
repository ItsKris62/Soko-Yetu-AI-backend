// backend/src/routes/resources.js
const express = require('express');
const router = express.Router();
const Resource = require('../models/resource');
const { logAudit } = require('../utils/auditLogger');

router.get('/', async (req, res, next) => {
  try {
    const { type, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const role = req.user?.role; // Optional: Filter by user role if authenticated

    const resources = await Resource.findAll({ type, role, limit: parseInt(limit), offset });
    const total = await Resource.count({ type, role });

    await logAudit(req.user?.id, 'view_resources', 'Resources list viewed', null, req);

    res.json({ resources, total });
  } catch (err) {
    next(err);
  }
});

module.exports = router;