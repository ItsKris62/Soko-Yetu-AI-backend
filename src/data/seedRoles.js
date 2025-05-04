// data/seedRoles.js
const pool = require('../config/database');

const seedRoles = async () => {
  try {
    const query = `
      INSERT INTO roles (name) VALUES
      ('farmer'),
      ('buyer'),
      ('admin')
      ON CONFLICT (name) DO NOTHING;
    `;
    await pool.query(query);
    console.log('Roles seeded successfully');
  } catch (err) {
    console.error('Error seeding roles:', err);
  }
};

module.exports = seedRoles;