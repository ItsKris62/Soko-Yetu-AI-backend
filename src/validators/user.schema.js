const Joi = require('joi')

// Update profile
exports.updateUserSchema = Joi.object({
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  gender: Joi.string().valid('male', 'female').required(),
  latitude: Joi.number().required(),
  longitude: Joi.number().required(),
  mode_of_payment: Joi.string().optional()
})

// Upload Avatar (Cloudinary URL - backend will assign)
exports.uploadAvatarSchema = Joi.object({
  image_url: Joi.string().uri().required()
})
