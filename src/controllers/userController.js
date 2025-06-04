// backend/controllers/userController.js
const User = require('../models/user');
const cloudinaryService = require('../services/cloudinaryService');
const { logAudit } = require('../utils/auditLogger');
const logger = require('../config/logger');

const userController = {
  async update(req, res, next) {
    try {
      const userId = req.params.id;
      const { first_name, last_name, phone_number, country_id, county_id, sub_county_id } = req.body;

      // Ensure user is updating their own profile
      if (userId !== req.user.id.toString()) {
        return res.status(403).json({ error: 'Unauthorized to update this profile' });
      }

      // Handle avatar and national ID uploads
      const avatar_url = req.files?.avatar ? await cloudinaryService.upload(req.files.avatar[0]) : null;
      const national_id_url = req.files?.national_id ? await cloudinaryService.upload(req.files.national_id[0]) : null;

      // Update user
      const updatedUser = await User.update(userId, {
        first_name,
        last_name,
        phone_number,
        country_id,
        county_id,
        sub_county_id,
        avatar_url,
        national_id_url,
      });

      // Log audit event
      await logAudit(req.user.id, 'update_profile', `User updated profile: ${updatedUser.email}`, null, req);

      res.json(updatedUser);
    } catch (err) {
      logger.error(`Profile update failed: ${err.message}`);
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const userId = req.params.id;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Public view: exclude sensitive fields
      const publicUser = {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone_number: user.phone_number,
        is_verified: user.is_verified,
        avatar_url: user.avatar_url,
      };

      // Log audit event
      await logAudit(req.user?.id, 'view_user_profile', `Viewed user profile: ${userId}`, null, req);

      res.json(publicUser);
    } catch (err) {
      logger.error(`User retrieval failed: ${err.message}`);
      next(err);
    }
  },

  async verify(req, res, next) {
    try {
      const { user_id } = req.body;

      // Validate input
      if (!user_id) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Verify user
      const user = await User.verify(user_id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Log audit event
      await logAudit(req.user.id, 'verify_user', `User verified: ${user_id}`, null, req);

      res.json({ message: 'User verified successfully', user });
    } catch (err) {
      logger.error(`User verification failed: ${err.message}`);
      next(err);
    }
  },

  async refreshToken(req, res, next) {
    try {
      // TODO: Implement actual token refresh logic.
      // This typically involves receiving a refresh token in the request body,
      // validating it, and issuing a new access token.
      // const { refreshToken } = req.body;
      // if (!refreshToken) {
      //   return res.status(400).json({ error: 'Refresh token is required' });
      // }
      // For now, let's assume you have a service to handle this.
      // const newAccessToken = await AuthService.refreshAccessToken(refreshToken);
      // res.json({ accessToken: newAccessToken });

      logger.info('User controller: refreshToken endpoint hit. Logic not yet implemented.');
      res.status(501).json({ message: 'Token refresh functionality not implemented yet.' });
    } catch (err) {
      logger.error(`Token refresh failed: ${err.message}`);
      next(err);
    }
  },

  async validateToken(req, res, next) {
    try {
      // The authMiddleware (applied in users.js) should have already run.
      // If the token was invalid, authMiddleware would have sent an error response,
      // and this handler would not be reached.
      // If we reach here, req.user is populated and the token is valid.
      logger.info(`Token validation successful for user ID: ${req.user.id}`);
      res.json({
        message: 'Token is valid.',
        user: { // Send back some basic user info if needed
          id: req.user.id,
          email: req.user.email, // Assuming email is part of req.user from authMiddleware
          role: req.user.role,   // Assuming role is part of req.user
        },
      });
    } catch (err) {
      logger.error(`Token validation endpoint error: ${err.message}`);
      next(err);
    }
  },
};

module.exports = userController;