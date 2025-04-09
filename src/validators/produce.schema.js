const Joi = require('joi')

exports.createProduceSchema = Joi.object({
  produce_type: Joi.string().required(),
  quantity: Joi.number().required(),
  unit: Joi.string().required(),
  price: Joi.number().required(),
  description: Joi.string().optional(),
  expires_at: Joi.date().optional()
})
