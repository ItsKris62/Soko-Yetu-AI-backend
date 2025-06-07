// backend/src/routes/community.js
const express = require('express');
const router = express.Router();
const ForumPost = require('../models/forum_post');
const ForumReply = require('../models/forum_reply');
const PostUpvote = require('../models/post_upvote');
const Notification = require('../models/notification');
const { logAudit } = require('../utils/auditLogger');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/posts', async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const posts = await ForumPost.findAll({ category, search, limit: parseInt(limit), offset });
    const total = await ForumPost.count({ category, search });

    await logAudit(req.user?.id, 'view_community_posts', 'Community posts viewed', null, req);

    res.json({ posts, total });
  } catch (err) {
    next(err);
  }
});

router.post('/posts', authMiddleware, async (req, res, next) => {
  try {
    const { title, content, category } = req.body;
    const user_id = req.user.id;

    if (!title || !content || !category) {
      return res.status(400).json({ error: 'Title, content, and category are required' });
    }

    const post = await ForumPost.create({ user_id, title, content, category });

    await logAudit(user_id, 'create_community_post', `Community post created: ${title}`, post.id, req);

    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
});

router.post('/posts/:postId/upvote', authMiddleware, async (req, res, next) => {
  try {
    const { postId } = req.params;
    const user_id = req.user.id;

    const post = await ForumPost.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const alreadyUpvoted = await PostUpvote.exists(postId, user_id);
    if (alreadyUpvoted) {
      return res.status(400).json({ error: 'You have already upvoted this post' });
    }

    await PostUpvote.create({ post_id: postId, user_id });
    const newUpvoteCount = await ForumPost.incrementUpvoteCount(postId);

    await logAudit(user_id, 'upvote_community_post', `Upvoted post: ${postId}`, postId, req);

    res.json({ upvote_count: newUpvoteCount });
  } catch (err) {
    next(err);
  }
});

router.get('/posts/:postId/replies', async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const replies = await ForumReply.findAllByPostId({ post_id: postId, limit: parseInt(limit), offset });
    const total = await ForumReply.countByPostId(postId);

    await logAudit(req.user?.id, 'view_community_replies', `Replies viewed for post: ${postId}`, postId, req);

    res.json({ replies, total });
  } catch (err) {
    next(err);
  }
});

router.post('/posts/:postId/replies', authMiddleware, async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const user_id = req.user.id;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const post = await ForumPost.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const reply = await ForumReply.create({ post_id: postId, user_id, content });

    // Notify the post author
    if (post.user_id !== user_id) {
      await Notification.create({
        user_id: post.user_id,
        type: 'new_reply',
        reference_id: postId,
        message: `${req.user.first_name} ${req.user.last_name} replied to your post: ${post.title}`,
      });
    }

    await logAudit(user_id, 'create_community_reply', `Reply created for post: ${postId}`, reply.id, req);

    res.status(201).json(reply);
  } catch (err) {
    next(err);
  }
});

router.get('/posts/:postId', async (req, res, next) => {
  try {
    const { postId } = req.params;
    const post = await ForumPost.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
  } catch (err) {
    next(err);
  }
});

module.exports = router;