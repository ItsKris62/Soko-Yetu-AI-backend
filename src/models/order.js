// backend/models/order.js
const db = require('../config/database');

const Order = {
  async create(order) {
    const query = `
      INSERT INTO orders (buyer_id, product_id, quantity, total_price, status)
      SELECT $1, $2, $3, ($3 * p.price), 'pending'
      FROM products p WHERE p.id = $2
      RETURNING *;
    `;
    const values = [order.buyer_id, order.product_id, order.quantity];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  async findAll(filters) {
    let query = `
      SELECT o.* FROM orders o
      JOIN products p ON o.product_id = p.id
      WHERE 1=1
    `;
    const values = [];
    let paramIndex = 1;

    if (filters.userId && filters.role === 'buyer') {
      query += ` AND o.buyer_id = $${paramIndex++}`;
      values.push(filters.userId);
    } else if (filters.userId && filters.role === 'farmer') {
      query += ` AND p.farmer_id = $${paramIndex++}`;
      values.push(filters.userId);
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    values.push(filters.limit, filters.offset);

    const result = await db.query(query, values);
    return result.rows;
  },

  async update(id, updates) {
    const query = 'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
    const values = [updates.status, id];
    const result = await db.query(query, values);
    return result.rows[0];
  },
};

module.exports = Order;