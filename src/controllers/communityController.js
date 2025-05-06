
// backend/controllers/communityController.js
const Community = require('../models/community');
const { logAudit } = require('../utils/auditLogger');
const logger = require('../config/logger');

const communityController = {
  async createPost(req, res, next) {
    try {
      const { title, content } = req.body;
      const user_id = req.user.id;

      // Validate inputs
      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }

      // Create post
      const post = await Community.createPost({ user_id, title, content });

      // Log audit event
      await logAudit(user_id, 'create_post', `Community post created: ${title}`, null, req);

      res.status(201).json(post);
    } catch (err) {
      logger.error(`Post creation failed: ${err.message}`);
      next(err);
    }
  },

  async getPosts(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const posts = await Community.findAll({ limit, offset });

      // Log audit event
      await logAudit(req.user?.id, 'view_posts', 'Viewed community posts', null, req);

      res.json(posts);
    } catch (err) {
      logger.error(`Post retrieval failed: ${err.message}`);
      next(err);
    }
  },

  async updatePost(req, res, next) {
    try {
      const postId = req.params.id;
      const { title, content } = req.body;
      const user_id = req.user.id;

      // Validate inputs
      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }

      // Check if post exists and belongs to user
      const post = await Community.findById(postId);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      if (post.user_id !== user_id) {
        return res.status(403).json({ error: 'Unauthorized to update this post' });
      }

      // Update post
      const updatedPost = await Community.update(postId, { title, content });

      // Log audit event
      await logAudit(user_id, 'update_post', `Community post updated: ${title}`, null, req);

      res.json(updatedPost);
    } catch (err) {
      logger.error(`Post update failed: ${err.message}`);
      next(err);
    }
  },

  async deletePost(req, res, next) {
    try {
      const postId = req.params.id;
      const user_id = req.user.id;

      // Check if post exists and belongs to user
      const post = await Community.findById(postId);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      if (post.user_id !== user_id) {
        return res.status(403).json({ error: 'Unauthorized to delete this post' });
      }

      // Delete post
      await Community.delete(postId);

      // Log audit event
      await logAudit(user_id, 'delete_post', `Community post deleted: ${post.title}`, null, req);

      res.json({ message: 'Post deleted successfully' });
    } catch (err) {
      logger.error(`Post deletion failed: ${err.message}`);
      next(err);
    }
  },
};

module.exports = communityController;