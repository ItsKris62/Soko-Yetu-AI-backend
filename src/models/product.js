// models/product.js
const pool = require('../config/database');

const Product = {
  async create(productData) {
    const {
      farmer_id,
      name,
      description,
      price,
      image_url,
      country_id,
      county_id,
      category_id,
      ai_suggested_price,
      ai_quality_grade,
    } = productData;
    const query = `
      INSERT INTO products (
        farmer_id, name, description, price, image_url, country_id, county_id, category_id,
        ai_suggested_price, ai_quality_grade, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
      RETURNING id, farmer_id, name, price, image_url, ai_suggested_price, ai_quality_grade, created_at
    `;
    const values = [
      farmer_id,
      name,
      description || null,
      price,
      image_url || null,
      country_id,
      county_id || null,
      category_id,
      ai_suggested_price || null,
      ai_quality_grade || null,
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  async findAll({ category_id, country_id, county_id, limit = 10, offset = 0 }) {
    let query = 'SELECT * FROM products WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (category_id) {
      query += ` AND category_id = $${paramCount++}`;
      values.push(category_id);
    }
    if (country_id) {
      query += ` AND country_id = $${paramCount++}`;
      values.push(country_id);
    }
    if (county_id) {
      query += ` AND county_id = $${paramCount++}`;
      values.push(county_id);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    values.push(limit, offset);

    const { rows } = await pool.query(query, values);
    return rows;
  },

  async findById(id) {
    const query = 'SELECT * FROM products WHERE id = $1';
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  },
};

module.exports = Product;