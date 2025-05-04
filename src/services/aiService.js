// services/aiService.js
const axios = require('axios');
require('dotenv').config();

const aiService = {
  async predictPrice(productData) {
    try {
      const response = await axios.post(`${process.env.AI_API_URL}/predict-price`, productData);
      return response.data; // Expected: { price: number, confidence: number }
    } catch (err) {
      throw new Error(`AI price prediction failed: ${err.message}`);
    }
  },

  async analyzeCrop(imageUrl) {
    try {
      const response = await axios.post(`${process.env.AI_API_URL}/analyze-crop`, { image_url: imageUrl });
      return response.data; // Expected: { grade: string, confidence: number }
    } catch (err) {
      throw new Error(`AI crop analysis failed: ${err.message}`);
    }
  },

  async forecastYield(userData, productData) {
    try {
      const response = await axios.post(`${process.env.AI_API_URL}/forecast-yield`, {
        user: userData,
        product: productData,
      });
      return response.data; // Expected: { yield: number, confidence: number, forecast_date: string }
    } catch (err) {
      throw new Error(`AI yield forecast failed: ${err.message}`);
    }
  },
};

module.exports = aiService;