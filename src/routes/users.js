// backend/routes/users.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.put(
  '/:id',
  authMiddleware,
  upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'national_id', maxCount: 1 }]),
  userController.update
);
router.get('/:id', authMiddleware, userController.getById);
router.post('/verify', authMiddleware, roleMiddleware(['admin']), userController.verify);

module.exports = router;