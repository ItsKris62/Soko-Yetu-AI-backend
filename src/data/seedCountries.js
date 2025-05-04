// data/seedCountries.js
const pool = require('../config/database');

const seedCountries = async () => {
  try {
    const query = `
      INSERT INTO countries (id, name) VALUES
      (1, 'Kenya'),
      (2, 'Uganda'),
      (3, 'Tanzania')
      ON CONFLICT DO NOTHING;
    `;
    await pool.query(query);
    console.log('Countries seeded successfully');
  } catch (err) {
    console.error('Error seeding countries:', err);
  }
};

module.exports = seedCountries;