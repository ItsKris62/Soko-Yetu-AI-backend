const express = require('express');
const router = express.Router();
const cloudinaryService = require('../services/cloudinaryService');

// POST /api/upload - Upload an image to Cloudinary
router.post('/', async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.files.file;
    const secure_url = await cloudinaryService.upload(file);
    res.json({ secure_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;