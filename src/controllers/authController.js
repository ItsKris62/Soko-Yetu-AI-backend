// controllers/authController.js
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../services/emailService');
const { logAudit } = require('../utils/auditLogger');
const logger = require('../config/logger');
const pool = require('../config/database');
require('dotenv').config();

const authController = {
  async register(req, res, next) {
    try {
      const {
        first_name,
        last_name,
        email,
        phone_number,
        password,
        role = 'farmer', // Default role
        country_id,
        county_id,
        sub_county_id,
      } = req.body;

      // Validate required fields
      if (!first_name || !last_name || !email || !phone_number || !password || !country_id || !county_id) {
        return res.status(400).json({ error: 'First name, last name, email, phone number, password, country, and county are required' });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Validate phone number (basic format, adjust as needed)
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phone_number)) {
        return res.status(400).json({ error: 'Invalid phone number format' });
      }

      // Validate password length
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }

      // Validate role
      if (!['farmer', 'buyer'].includes(role)) {
        return res.status(400).json({ error: 'Role must be "farmer" or "buyer"' });
      }

      // Validate country_id
      const countryCheck = await pool.query('SELECT id FROM countries WHERE id = $1', [country_id]);
      if (!countryCheck.rows[0]) {
        return res.status(400).json({ error: 'Invalid country_id' });
      }

      // Validate county_id
      const countyCheck = await pool.query('SELECT id FROM counties WHERE id = $1 AND country_id = $2', [
        county_id,
        country_id,
      ]);
      if (!countyCheck.rows[0]) {
        return res.status(400).json({ error: 'Invalid county_id or county does not belong to selected country' });
      }

      // Validate sub_county_id (optional)
      if (sub_county_id) {
        const subCountyCheck = await pool.query('SELECT id FROM sub_counties WHERE id = $1 AND county_id = $2', [
          sub_county_id,
          county_id,
        ]);
        if (!subCountyCheck.rows[0]) {
          return res.status(400).json({ error: 'Invalid sub_county_id or sub-county does not belong to selected county' });
        }
      }

      // Check if user exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Check phone number uniqueness
      const phoneCheck = await pool.query('SELECT id FROM users WHERE phone_number = $1', [phone_number]);
      if (phoneCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Phone number already registered' });
      }

      // Create user (no avatar or national_id)
      const user = await User.create({
        first_name,
        last_name,
        email,
        phone_number,
        password,
        gender: null, // Not provided in frontend
        country_id,
        county_id,
        sub_county_id: sub_county_id || null,
        id_number: null, // Not provided
        avatar_url: null, // Not provided
        national_id_url: null, // Not provided
        is_verified: false, // Default per schema
      });

      // Assign role
      const roleCheck = await pool.query('SELECT id FROM roles WHERE name = $1', [role]);
      if (!roleCheck.rows[0]) {
        return res.status(500).json({ error: 'Role not found in database' });
      }
      await pool.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [user.id, roleCheck.rows[0].id]);

      // Log audit event
      await logAudit(user.id, 'register', `User registered with email: ${email}`, null, req);

      // Generate JWT
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

      res.status(201).json({ user, token });
    } catch (err) {
      logger.error(`Registration failed: ${err.message}`);
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Find user
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Log audit event
      await logAudit(user.id, 'login', `User logged in with email: ${email}`, null, req);

      // Generate JWT
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

      res.json({
        user: { id: user.id, email: user.email, first_name: user.first_name, is_verified: user.is_verified },
        token,
      });
    } catch (err) {
      logger.error(`Login failed: ${err.message}`);
      next(err);
    }
  },

  async requestPasswordReset(req, res, next) {
    try {
      const { email } = req.body;

      // Validate email
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Generate reset token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour
      await pool.query(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
        [user.id, token, expiresAt]
      );

      // Send email
      const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
      await emailService.sendEmail(
        email,
        'Password Reset Request',
        `Click here to reset your password: ${resetUrl}`
      );

      // Log audit event
      await logAudit(user.id, 'password_reset_request', `Password reset requested for email: ${email}`, null, req);

      res.json({ message: 'Password reset email sent' });
    } catch (err) {
      logger.error(`Password reset request failed: ${err.message}`);
      next(err);
    }
  },

  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;

      // Validate inputs
      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required' });
      }

      // Validate password length
      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters' });
      }

      const tokenRecord = await pool.query(
        'SELECT * FROM password_reset_tokens WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP',
        [token]
      );
      if (!tokenRecord.rows[0]) {
        return res.status(400).json({ error: 'Invalid or expired token' });
      }

      const userId = tokenRecord.rows[0].user_id;
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
        hashedPassword,
        userId,
      ]);

      // Delete used token
      await pool.query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);

      // Log audit event
      await logAudit(userId, 'password_reset', 'Password reset successfully', null, req);

      res.json({ message: 'Password reset successful' });
    } catch (err) {
      logger.error(`Password reset failed: ${err.message}`);
      next(err);
    }
  },

  async getMe(req, res, next) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      // Log audit event
      await logAudit(user.id, 'view_profile', 'User viewed own profile', null, req);
      res.json(user);
    } catch (err) {
      logger.error(`Profile retrieval failed: ${err.message}`);
      next(err);
    }
  },
};

module.exports = authController;