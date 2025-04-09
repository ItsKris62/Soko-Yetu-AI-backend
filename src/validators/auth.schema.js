const Joi = require('joi')

exports.registerSchema = Joi.object({
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  id_number: Joi.string().required(),
  gender: Joi.string().valid('male', 'female').required(),
  role: Joi.string().valid('farmer', 'buyer', 'other').required(),
  password: Joi.string().min(6).required(),
})

exports.loginSchema = Joi.object({
  id_number: Joi.string().required(),
  password: Joi.string().required(),
})

exports.resetStep1 = Joi.object({
  id_number: Joi.string().required(),
})

exports.resetStep2 = Joi.object({
  id_number: Joi.string().required(),
  phone: Joi.string().required(),
  name: Joi.string().required(),
})

exports.resetFinal = Joi.object({
  id_number: Joi.string().required(),
  password: Joi.string().min(6).required(),
})
