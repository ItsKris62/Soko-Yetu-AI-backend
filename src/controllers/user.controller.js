const db = require('../models/db')
const cloudinary = require('../utils/cloudinary')
const fs = require('fs')

// UPDATE USER PROFILE
exports.updateProfile = async (req, res) => {
  const { first_name, last_name, gender, mode_of_payment, latitude, longitude } = req.body

  try {
    await db.query(
      `UPDATE users SET first_name = $1, last_name = $2, gender = $3
       WHERE id = $4`,
      [first_name, last_name, gender, longitude, latitude, req.user.id]
    )

    if (req.user.role === 'farmer' && mode_of_payment) {
      await db.query(
        `UPDATE farmers SET mode_of_payment = $1, updated_at = now() WHERE user_id = $2`,
        [mode_of_payment, req.user.id]
      )
    }

    res.json({ message: 'Profile updated' })
  } catch (err) {
    res.status(500).json({ message: 'Update failed', error: err.message })
  }
}

// UPLOAD PROFILE PICTURE
exports.uploadAvatar = async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'avatars',
      public_id: `user_${req.user.id}`,
    })

    fs.unlinkSync(req.file.path) // remove temp file

    await db.query(
      `UPDATE users SET profile_picture = $1 WHERE id = $2`,
      [result.secure_url, req.user.id]
    )

    res.json({ message: 'Profile picture updated', url: result.secure_url })
  } catch (err) {
    res.status(500).json({ message: 'Avatar upload failed', error: err.message })
  }
}

// DELETE AVATAR
exports.deleteAvatar = async (req, res) => {
    try {
      const user = await db.query('SELECT profile_picture FROM users WHERE id = $1', [req.user.id])
      const imageUrl = user.rows[0]?.profile_picture
  
      if (!imageUrl) return res.status(404).json({ message: 'No avatar found' })
  
      // Extract public ID from Cloudinary URL
      const parts = imageUrl.split('/')
      const filename = parts[parts.length - 1].split('.')[0] // user_123
      const publicId = `avatars/${filename}`
  
      await cloudinary.uploader.destroy(publicId)
  
      await db.query('UPDATE users SET profile_picture = NULL WHERE id = $1', [req.user.id])
  
      res.json({ message: 'Avatar deleted successfully' })
    } catch (err) {
      res.status(500).json({ message: 'Failed to delete avatar', error: err.message })
    }
  }
  