const db = require('../models/db')
const cloudinary = require('../utils/cloudinary')
const fs = require('fs')

// UPLOAD PRODUCE IMAGE
exports.uploadProduceImage = async (req, res) => {
  const { produce_id } = req.body

  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'produce_images',
    })

    fs.unlinkSync(req.file.path)

    const dbRes = await db.query(
      `INSERT INTO produce_images (produce_id, image_url, cloudinary_public_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [produce_id, result.secure_url, result.public_id]
    )

    res.json({ message: 'Image uploaded', image: dbRes.rows[0] })
  } catch (err) {
    res.status(500).json({ message: 'Image upload failed', error: err.message })
  }
}

//DELETE PRODUCE IMAGE
exports.deleteProduceImage = async (req, res) => {
    const { image_id } = req.params
  
    try {
      const img = await db.query('SELECT cloudinary_public_id FROM produce_images WHERE image_id = $1', [image_id])
      if (!img.rowCount) return res.status(404).json({ message: 'Image not found' })
  
      const publicId = img.rows[0].cloudinary_public_id
      await cloudinary.uploader.destroy(publicId)
  
      await db.query('DELETE FROM produce_images WHERE image_id = $1', [image_id])
      res.json({ message: 'Image deleted' })
    } catch (err) {
      res.status(500).json({ message: 'Delete failed', error: err.message })
    }
  }
  

  //Nearby Produce

  exports.getNearbyProduce = async (req, res) => {
    const { lat, lng, radius = 100 } = req.query
  
    try {
      const sql = `
        SELECT p.*, u.first_name, u.last_name, u.location,
               ST_Distance(u.location, ST_GeogPoint($1, $2)) AS distance
        FROM produce p
        JOIN farmers f ON p.farmer_id = f.user_id
        JOIN users u ON f.user_id = u.id
        WHERE p.available = true
          AND ST_DWithin(u.location, ST_GeogPoint($1, $2), $3 * 1000)
        ORDER BY distance ASC
      `
  
      const result = await db.query(sql, [lng, lat, radius])
      res.json(result.rows)
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch nearby produce', error: err.message })
    }
  }
  