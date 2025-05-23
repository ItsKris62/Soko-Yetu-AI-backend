// models/predefined_product.js
const pool = require('../config/database');

const PredefinedProduct = {
  async create(productData) {
    const { category_id, name } = productData;
    const query = `
      INSERT INTO predefined_products (category_id, name, created_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const values = [category_id, name];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  async findAll() {
    const query = `
      SELECT pp.id, pp.name, pp.category_id, c.name as category_name
      FROM predefined_products pp
      JOIN categories c ON pp.category_id = c.id
      ORDER BY c.name ASC, pp.name ASC
    `;
    const { rows } = await pool.query(query);
    return rows;
  },

  async findByCategoryId(categoryId) {
    const query = `
      SELECT pp.id, pp.name, pp.category_id, c.name as category_name
      FROM predefined_products pp
      JOIN categories c ON pp.category_id = c.id
      WHERE pp.category_id = $1
      ORDER BY pp.name ASC
    `;
    const { rows } = await pool.query(query, [categoryId]);
    return rows;
  },

  async findById(id) {
    const query = `
      SELECT pp.id, pp.name, pp.category_id, c.name as category_name
      FROM predefined_products pp
      JOIN categories c ON pp.category_id = c.id
      WHERE pp.id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  },

  async findSuggestions(query, limit = 5) {
    const searchTerm = `%${query}%`;
    const sqlQuery = `
      SELECT pp.name
      FROM predefined_products pp
      WHERE pp.name ILIKE $1
      LIMIT $2
    `;
    const values = [searchTerm, limit];
    const { rows } = await pool.query(sqlQuery, values);
    return rows.map(row => row.name);
  },
};

module.exports = PredefinedProduct;