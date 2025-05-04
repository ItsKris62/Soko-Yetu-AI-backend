// Handles image uploads to Cloudinary

// services/cloudinaryService.js
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryService = {
  async upload(file) {
    try {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }).end(file.buffer);
      });
      return result.secure_url;
    } catch (err) {
      throw new Error(`Cloudinary upload failed: ${err.message}`);
    }
  },
};

module.exports = cloudinaryService;