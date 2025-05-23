// models/product.js
const pool = require('../config/database');

const Product = {
  async create(productData) {
    const {
      farmer_id,
      predefined_product_id,
      category_id,
      description,
      price,
      image_url,
      country_id,
      county_id,
      ai_suggested_price,
      ai_quality_grade,
    } = productData;
    const query = `
      INSERT INTO products (
        farmer_id, predefined_product_id, category_id, description, price, image_url, country_id, county_id,
        ai_suggested_price, ai_quality_grade, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
      RETURNING id, farmer_id, predefined_product_id, category_id, description, price, image_url, country_id, county_id, ai_suggested_price, ai_quality_grade, created_at
    `;
    const values = [
      farmer_id,
      predefined_product_id,
      category_id,
      description || null,
      price,
      image_url || null,
      country_id,
      county_id || null,
      ai_suggested_price || null,
      ai_quality_grade || null,
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  async findAll(filters = {}) {
    const {
      category_id,
      country_id,
      county_id,
      price,
      ai_quality_grade,
      $or,
      limit = 10,
      offset = 0,
      order = [['created_at', 'DESC']],
    } = filters;

    let query = `
      SELECT 
        p.id, p.farmer_id, p.predefined_product_id, p.category_id, p.description, p.price, p.image_url, 
        p.country_id, p.county_id, p.ai_suggested_price, p.ai_quality_grade, p.created_at,
        pp.name as product_name, c.name as category_name
      FROM products p
      JOIN predefined_products pp ON p.predefined_product_id = pp.id
      JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (category_id) {
      query += ` AND p.category_id = $${paramCount++}`;
      values.push(category_id);
    }
    if (country_id) {
      query += ` AND p.country_id = $${paramCount++}`;
      values.push(country_id);
    }
    if (county_id) {
      query += ` AND p.county_id = $${paramCount++}`;
      values.push(county_id);
    }
    if (price) {
      if (price.$gte !== undefined) {
        query += ` AND p.price >= $${paramCount++}`;
        values.push(price.$gte);
      }
      if (price.$lte !== undefined) {
        query += ` AND p.price <= $${paramCount++}`;
        values.push(price.$lte);
      }
    }
    if (ai_quality_grade && ai_quality_grade.$gte !== undefined) {
      query += ` AND p.ai_quality_grade >= $${paramCount++}`;
      values.push(ai_quality_grade.$gte);
    }
    if ($or && Array.isArray($or) && $or.length > 0) {
      const searchQuery = $or[0]?.name?.$like?.replace(/%/g, '');
      const orClauses = [];
      $or.forEach(condition => {
        if (condition.name && condition.name.$like) {
          orClauses.push(`pp.name ILIKE $${paramCount++}`);
          values.push(condition.name.$like);
        }
        if (condition.description && condition.description.$like) {
          orClauses.push(`p.description ILIKE $${paramCount++}`);
          values.push(condition.description.$like);
        }
      });
      if (orClauses.length > 0) {
        query += ` AND (${orClauses.join(' OR ')})`;

        if (searchQuery) {
          query += `
            ORDER BY 
              CASE 
                WHEN pp.name ILIKE $${paramCount++} THEN 1
                WHEN pp.name ILIKE $${paramCount++} THEN 2
                WHEN p.description ILIKE $${paramCount++} THEN 3
                WHEN p.description ILIKE $${paramCount++} THEN 4
                ELSE 5
              END ASC,
              p.price ASC
          `;
          values.push(`${searchQuery}%`, `%${searchQuery}%`, `${searchQuery}%`, `%${searchQuery}%`);
        }
      }
    } else {
      query += ' ORDER BY ';
      order.forEach(([column, direction], index) => {
        if (index > 0) query += ', ';
        query += `p.${column} ${direction}`;
      });
    }

    query += ` LIMIT $${paramCount++} OFFSET $${paramCount}`;
    values.push(limit, offset);

    const { rows } = await pool.query(query, values);
    return rows;
  },

  async count(filters = {}) {
    const {
      category_id,
      country_id,
      county_id,
      price,
      ai_quality_grade,
      $or,
    } = filters;

    let query = `
      SELECT COUNT(*) 
      FROM products p
      JOIN predefined_products pp ON p.predefined_product_id = pp.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (category_id) {
      query += ` AND p.category_id = $${paramCount++}`;
      values.push(category_id);
    }
    if (country_id) {
      query += ` AND p.country_id = $${paramCount++}`;
      values.push(country_id);
    }
    if (county_id) {
      query += ` AND p.county_id = $${paramCount++}`;
      values.push(county_id);
    }
    if (price) {
      if (price.$gte !== undefined) {
        query += ` AND p.price >= $${paramCount++}`;
        values.push(price.$gte);
      }
      if (price.$lte !== undefined) {
        query += ` AND p.price <= $${paramCount++}`;
        values.push(price.$lte);
      }
    }
    if (ai_quality_grade && ai_quality_grade.$gte !== undefined) {
      query += ` AND p.ai_quality_grade >= $${paramCount++}`;
      values.push(ai_quality_grade.$gte);
    }
    if ($or && Array.isArray($or) && $or.length > 0) {
      const orClauses = [];
      $or.forEach(condition => {
        if (condition.name && condition.name.$like) {
          orClauses.push(`pp.name ILIKE $${paramCount++}`);
          values.push(condition.name.$like);
        }
        if (condition.description && condition.description.$like) {
          orClauses.push(`p.description ILIKE $${paramCount++}`);
          values.push(condition.description.$like);
        }
      });
      if (orClauses.length > 0) {
        query += ` AND (${orClauses.join(' OR ')})`;
      }
    }

    const { rows } = await pool.query(query, values);
    return parseInt(rows[0].count, 10);
  },

  async findById(id) {
    const query = `
      SELECT 
        p.id, p.farmer_id, p.predefined_product_id, p.category_id, p.description, p.price, p.image_url, 
        p.country_id, p.county_id, p.ai_suggested_price, p.ai_quality_grade, p.created_at,
        pp.name as product_name, c.name as category_name
      FROM products p
      JOIN predefined_products pp ON p.predefined_product_id = pp.id
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
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

  async update(id, productData) {
    const {
      predefined_product_id,
      category_id,
      description,
      price,
      image_url,
      country_id,
      county_id,
      ai_suggested_price,
      ai_quality_grade,
    } = productData;
    const query = `
      UPDATE products
      SET 
        predefined_product_id = $1,
        category_id = $2,
        description = $3,
        price = $4,
        image_url = $5,
        country_id = $6,
        county_id = $7,
        ai_suggested_price = $8,
        ai_quality_grade = $9,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING id, farmer_id, predefined_product_id, category_id, description, price, image_url, country_id, county_id, ai_suggested_price, ai_quality_grade, created_at, updated_at
    `;
    const values = [
      predefined_product_id,
      category_id,
      description || null,
      price,
      image_url || null,
      country_id,
      county_id || null,
      ai_suggested_price || null,
      ai_quality_grade || null,
      id,
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  async delete(id) {
    const query = 'DELETE FROM products WHERE id = $1';
    await pool.query(query, [id]);
  },
};

module.exports = Product;