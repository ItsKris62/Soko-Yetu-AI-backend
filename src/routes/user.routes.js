const express = require('express')
const router = express.Router()
const userController = require('../controllers/user.controller')
const auth = require('../middleware/auth.middleware')
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })

router.patch('/update', auth, userController.updateProfile)
router.post('/avatar', auth, upload.single('image'), userController.uploadAvatar)

router.delete('/avatar', auth, userController.deleteAvatar)


module.exports = router
