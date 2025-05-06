// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/register', upload.fields([{ name: 'avatar' }, { name: 'national_id' }]), authController.register);
router.post('/login', authController.login);
router.post('/password-reset', authController.requestPasswordReset);
router.post('/password-reset/:token', authController.resetPassword);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;