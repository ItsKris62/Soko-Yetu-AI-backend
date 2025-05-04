// models/user.js
const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const User = {
  async create(userData) {
    const {
      first_name,
      last_name,
      email,
      phone_number,
      password,
      gender,
      country_id,
      county_id,
      sub_county_id,
      id_number,
      avatar_url,
      national_id_url,
    } = userData;

    // Validate gender (matches CHECK constraint)
    if (gender && !['male', 'female', 'other'].includes(gender)) {
      throw new Error('Invalid gender value');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `
      INSERT INTO users (
        first_name, last_name, email, phone_number, password, gender,
        country_id, county_id, sub_county_id, id_number, avatar_url, national_id_url, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
      RETURNING id, first_name, last_name, email, phone_number, is_verified, created_at
    `;
    const values = [
      first_name,
      last_name,
      email,
      phone_number,
      hashedPassword,
      gender || null,
      country_id,
      county_id || null, // Nullable for non-Kenyan users
      sub_county_id || null, // Nullable for non-Kenyan users
      id_number || null,
      avatar_url || null,
      national_id_url || null,
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const { rows } = await pool.query(query, [email]);
    return rows[0];
  },

  async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  },

  async update(id, updates) {
    const { first_name, last_name, phone_number, gender, country_id, county_id, sub_county_id, avatar_url } = updates;
    const query = `
      UPDATE users
      SET first_name = $1, last_name = $2, phone_number = $3, gender = $4,
          country_id = $5, county_id = $6, sub_county_id = $7, avatar_url = $8, updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING id, first_name, last_name, email, phone_number, is_verified, created_at, updated_at
    `;
    const values = [
      first_name,
      last_name,
      phone_number,
      gender || null,
      country_id,
      county_id || null,
      sub_county_id || null,
      avatar_url || null,
      id,
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },
};

module.exports = User;