const express = require('express')
const router = express.Router()
const produce = require('../controllers/produce.controller')
const auth = require('../middleware/auth.middleware')
const farmerOnly = require('../middleware/role.middleware')('farmer')
const validate = require('../middleware/validate.middleware')
const upload = require('multer')({ dest: 'uploads/' })
const { createProduceSchema } = require('../validators/produce.schema')

// 🌾 Create a new produce listing (Farmer only)
router.post('/', auth, farmerOnly, validate(createProduceSchema), produce.createProduce)

// 🖼 Upload produce image
router.post('/upload-image', auth, farmerOnly, upload.single('image'), produce.uploadProduceImage)

// 🗑 Delete produce image
router.delete('/image/:image_id', auth, farmerOnly, produce.deleteProduceImage)

// 🌍 Get nearby produce for buyer
router.get('/nearby', produce.getNearbyProduce)

// 🗂 Get all produce for a user
router.get('/my', auth, farmerOnly, produce.getMyProduce)

// 🔄 Update a produce listing
router.patch('/:produce_id', auth, farmerOnly, produce.updateProduce)

// ❌ Delete a produce listing
router.delete('/:produce_id', auth, farmerOnly, produce.deleteProduce)

module.exports = router
