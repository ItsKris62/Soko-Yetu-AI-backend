const db = require('../models/db')
const cloudinary = require('../utils/cloudinary')
const fs = require('fs')

// Create a new produce listing
exports.createProduce = async (req, res) => {
  try {
    // Extract produce details from request body
    const {
      produce_type,
      category_id,
      quantity,
      unit,
      price,
      description,
      expires_at, // optional – in a format acceptable to your DB (or NULL)
    } = req.body;
    
    // Farmer's user id (provided by auth middleware in req.user)
    const farmer_id = req.user.id;
    
    // Insert produce into the database
    const result = await db.query(
      `INSERT INTO produce (
         farmer_id,
         category_id,
         produce_type,
         quantity,
         unit,
         price,
         description,
         available,
         listed_at,
         expires_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), $8)
       RETURNING *`,
      [farmer_id, category_id, produce_type, quantity, unit, price, description, expires_at]
    );
    
    res.status(201).json({
      message: "Produce created successfully",
      produce: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// Upload produce image
exports.uploadProduceImage = async (req, res) => {
  // Expecting produce_id in req.body along with file uploaded via multer
  const { produce_id } = req.body;

  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'produce_images',
    });

    // Remove the locally stored file
    fs.unlinkSync(req.file.path);

    const dbRes = await db.query(
      `INSERT INTO produce_images (produce_id, image_url, cloudinary_public_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [produce_id, result.secure_url, result.public_id]
    );

    res.json({ message: 'Image uploaded', image: dbRes.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Image upload failed', error: err.message });
  }
};

// Delete produce image
exports.deleteProduceImage = async (req, res) => {
  const { image_id } = req.params;

  try {
    const img = await db.query(
      'SELECT cloudinary_public_id FROM produce_images WHERE image_id = $1',
      [image_id]
    );
    if (!img.rowCount)
      return res.status(404).json({ message: 'Image not found' });

    const publicId = img.rows[0].cloudinary_public_id;
    await cloudinary.uploader.destroy(publicId);

    await db.query('DELETE FROM produce_images WHERE image_id = $1', [image_id]);
    res.json({ message: 'Image deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Delete failed', error: err.message });
  }
};
  

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


  // Get all produce listings for the authenticated (farmer) user
exports.getMyProduce = async (req, res) => {
  try {
    const farmer_id = req.user.id;
    const result = await db.query(
      `SELECT * FROM produce WHERE farmer_id = $1 ORDER BY listed_at DESC`,
      [farmer_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
  

// Update a produce listing
exports.updateProduce = async (req, res) => {
  try {
    const { produce_id } = req.params;
    const farmer_id = req.user.id;
    // Fields to update (if provided)
    const { produce_type, category_id, quantity, unit, price, description, expires_at } = req.body;
    
    // Verify that the produce belongs to the farmer
    const checkRes = await db.query(
      `SELECT * FROM produce WHERE produce_id = $1 AND farmer_id = $2`,
      [produce_id, farmer_id]
    );
    if (checkRes.rowCount === 0) {
      return res.status(404).json({ message: "Produce not found or not authorized" });
    }
    
    const updateRes = await db.query(
      `UPDATE produce SET
         produce_type = COALESCE($1, produce_type),
         category_id = COALESCE($2, category_id),
         quantity = COALESCE($3, quantity),
         unit = COALESCE($4, unit),
         price = COALESCE($5, price),
         description = COALESCE($6, description),
         expires_at = COALESCE($7, expires_at),
         updated_at = NOW()
       WHERE produce_id = $8
       RETURNING *`,
      [produce_type, category_id, quantity, unit, price, description, expires_at, produce_id]
    );
    
    res.json({
      message: "Produce updated successfully",
      produce: updateRes.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


// Delete a produce listing
exports.deleteProduce = async (req, res) => {
  try {
    const { produce_id } = req.params;
    const farmer_id = req.user.id;
    
    // Verify produce ownership
    const checkRes = await db.query(
      `SELECT * FROM produce WHERE produce_id = $1 AND farmer_id = $2`,
      [produce_id, farmer_id]
    );
    if (checkRes.rowCount === 0) {
      return res.status(404).json({ message: "Produce not found or not authorized" });
    }
    
    // Optionally, delete associated produce images first if not cascading
    await db.query(`DELETE FROM produce_images WHERE produce_id = $1`, [produce_id]);
    
    await db.query(`DELETE FROM produce WHERE produce_id = $1`, [produce_id]);
    res.json({ message: "Produce deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};