const express = require('express')
const router = express.Router()
const controller = require('../controllers/auth.controller')
const isAuth = require('../middleware/auth.middleware')

router.post('/register', controller.register)
router.post('/login', controller.login)
router.get('/me', isAuth, controller.getMe)

router.get('/refresh', controller.refresh)
router.post('/logout', controller.logout)


router.post('/reset-step1', controller.resetStep1)
router.post('/reset-step2', controller.resetStep2)
router.post('/reset-final', controller.resetFinal)

module.exports = router
