// backend/routes/community.js
const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/posts', authMiddleware, communityController.createPost);
router.get('/posts', communityController.getPosts);
router.put('/posts/:id', authMiddleware, communityController.updatePost);
router.delete('/posts/:id', authMiddleware, communityController.deletePost);

module.exports = router;