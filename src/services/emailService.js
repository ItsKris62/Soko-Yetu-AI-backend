// services/emailService.js
const nodemailer = require('nodemailer');
const { logger } = require('../config/logger'); // Winston logger
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'in-v3.mailjet.com', // Mailjet SMTP server
  port: 587, // TLS port
  secure: false, // Use TLS (secure: true for port 465, false for 587)
  auth: {
    user: process.env.MAILJET_API_KEY, // API Key as SMTP username
    pass: process.env.MAILJET_API_SECRET, // Secret Key as SMTP password
  },
  tls: {
    ciphers: 'SSLv3', // Ensure compatibility with Mailjet
  },
});

const emailService = {
  async sendEmail(to, subject, resetUrl) {
    try {
      // HTML email template for password reset
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Password Reset Request</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c3e50;">Soko Yetu Password Reset</h2>
            <p>We received a request to reset your password. Click the button below to set a new password:</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: #fff; text-decoration: none; border-radius: 5px; margin: 10px 0;">
              Reset Password
            </a>
            <p>Or copy and paste this link into your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you did not request a password reset, please ignore this email or contact our support team at <a href="mailto:support@sokoyetu.com">support@sokoyetu.com</a>.</p>
            <p>Thank you,<br>The Soko Yetu Team</p>
            <hr>
            <p style="font-size: 12px; color: #777;">This is an automated message, please do not reply directly to this email.</p>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"Soko Yetu" <${process.env.MAILJET_SENDER_EMAIL}>`, // Sender address
        to, // Recipient email
        subject, // Subject line
        html: htmlContent, // HTML content
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`Email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (err) {
      logger.error(`Failed to send email to ${to}: ${err.message}`);
      throw new Error(`Failed to send email: ${err.message}`);
    }
  },
};

module.exports = emailService;