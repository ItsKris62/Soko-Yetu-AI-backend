const Joi = require('joi')

// Predict Price
exports.pricePredictionSchema = Joi.object({
  produce_type: Joi.string().required(),
  quantity: Joi.number().required(),
  unit: Joi.string().required(),
  location: Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required()
  }).required()
})

// Quality Analysis
exports.qualityAnalysisSchema = Joi.object({
  produce_type: Joi.string().required(),
  image_url: Joi.string().uri().required()
})
