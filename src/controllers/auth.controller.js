// src/controllers/auth.controller.js
const db      = require('../models/db')
const bcrypt  = require('bcrypt')
const { signToken } = require('../utils/jwt')

const {
  registerSchema,
  loginSchema,
  resetStep1,
  resetStep2,
  resetFinal,
} = require('../validators/auth.schema')

// REGISTER
exports.register = async (req, res) => {
  try {
    // 1. Validate incoming payload
    const data = await registerSchema.validateAsync(req.body)
    const {
      first_name,
      last_name,
      id_number,
      gender,
      role,
      phone,
      password,
      county_id,
      sub_county_id,
      mode_of_payment,
    } = data

    // 2. Prevent duplicate ID numbers
    const existing = await db.query(
      'SELECT 1 FROM users WHERE id_number = $1',
      [id_number]
    )
    if (existing.rowCount > 0) {
      return res.status(400).json({ message: 'ID already exists' })
    }

    // 3. Validate county_id exists
    const countyCheck = await db.query(
      'SELECT 1 FROM counties WHERE county_id = $1',
      [county_id]
    )
    if (countyCheck.rowCount === 0) {
      return res.status(400).json({ message: 'Invalid county_id' })
    }

    // 4. Validate sub_county_id exists under that county
    const subCountyCheck = await db.query(
      'SELECT 1 FROM sub_counties WHERE sub_county_id = $1 AND county_id = $2',
      [sub_county_id, county_id]
    )
    if (subCountyCheck.rowCount === 0) {
      return res
        .status(400)
        .json({ message: 'Invalid sub_county_id for that county' })
    }

    // 5. Hash the password
    const hashed = await bcrypt.hash(password, 10)

    // 6. Insert new user (no more location column)
    const userRes = await db.query(
      `INSERT INTO users (
         first_name,
         last_name,
         id_number,
         gender,
         role,
         phone,
         password,
         county_id,
         sub_county_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, role`,
      [
        first_name,
        last_name,
        id_number,
        gender,
        role,
        phone,
        hashed,
        county_id,
        sub_county_id,
      ]
    )

    const user = userRes.rows[0]

    // 7. If farmer, insert into farmers table
    if (role === 'farmer') {
      await db.query(
        `INSERT INTO farmers (user_id, mode_of_payment)
         VALUES ($1, $2)`,
        [user.id, mode_of_payment || 'M-PESA']
      )
    }

    // 8. Sign a JWT and set it in an HTTP‑only cookie
    const token = signToken({ id: user.id, role: user.role })
    res
      .cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 3600000,
      })
      .json({ message: 'Registered successfully', role: user.role })

  } catch (err) {
    console.error('Register error:', err)
    res.status(400).json({ message: err.message })
  }
}

// LOGIN
exports.login = async (req, res) => {
  try {
    const data = await loginSchema.validateAsync(req.body)
    const { id_number, password } = data

    const result = await db.query(
      'SELECT * FROM users WHERE id_number = $1',
      [id_number]
    )
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    const user = result.rows[0]
    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return res.status(401).json({ message: 'Incorrect password' })
    }

    const token = signToken({ id: user.id, role: user.role })
    res
      .cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 3600000,
      })
      .json({ message: 'Login successful', user: { id: user.id, role: user.role } })

  } catch (err) {
    console.error('Login error:', err)
    res.status(400).json({ message: err.message })
  }
}

// SESSION
exports.getMe = async (req, res) => {
  const userRes = await db.query(
    `SELECT
       u.id,
       u.first_name,
       u.last_name,
       u.id_number,
       u.role,
       u.gender,
       c.county_name,
       s.sub_county_name
     FROM users u
     LEFT JOIN counties c ON u.county_id = c.county_id
     LEFT JOIN sub_counties s ON u.sub_county_id = s.sub_county_id
     WHERE u.id = $1`,
    [req.user.id]
  )

  if (userRes.rowCount === 0) {
    return res.status(404).json({ message: 'User not found' })
  }
  res.json(userRes.rows[0])
}

// REFRESH TOKEN
exports.refresh = (req, res) => {
  const token = req.cookies.token
  if (!token) {
    return res.status(401).json({ message: 'No token provided' })
  }

  try {
    const { verifyToken, signToken } = require('../utils/jwt')
    const decoded = verifyToken(token)
    const newToken = signToken({ id: decoded.id, role: decoded.role })

    res
      .cookie('token', newToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 3600000,
      })
      .json({ message: 'Token refreshed' })

  } catch (err) {
    console.error('Refresh token error:', err)
    res.status(401).json({ message: 'Invalid token' })
  }
}

// LOGOUT
exports.logout = (req, res) => {
  res.clearCookie('token').json({ message: 'Logged out' })
}

// PASSWORD RESET FLOW
exports.resetStep1 = async (req, res) => {
  try {
    const { id_number } = await resetStep1.validateAsync(req.body)
    const result = await db.query(
      'SELECT 1 FROM users WHERE id_number = $1',
      [id_number]
    )
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'ID not found' })
    }
    res.json({ message: 'ID exists' })
  } catch (err) {
    console.error('Reset step1 error:', err)
    res.status(400).json({ message: err.message })
  }
}

exports.resetStep2 = async (req, res) => {
  try {
    const { id_number, phone, name } = await resetStep2.validateAsync(req.body)
    const [first, last] = name.trim().split(' ')
    const result = await db.query(
      `SELECT 1 FROM users
       WHERE id_number = $1
         AND first_name ILIKE $2
         AND last_name ILIKE $3`,
      [id_number, `%${first}%`, `%${last || ''}%`]
    )
    if (result.rowCount === 0) {
      return res.status(401).json({ message: 'Identity mismatch' })
    }
    res.json({ message: 'Verified' })
  } catch (err) {
    console.error('Reset step2 error:', err)
    res.status(400).json({ message: err.message })
  }
}

exports.resetFinal = async (req, res) => {
  try {
    const { id_number, password } = await resetFinal.validateAsync(req.body)
    const hashed = await bcrypt.hash(password, 10)
    await db.query(
      'UPDATE users SET password = $1 WHERE id_number = $2',
      [hashed, id_number]
    )
    res.json({ message: 'Password updated' })
  } catch (err) {
    console.error('Reset final error:', err)
    res.status(400).json({ message: err.message })
  }
}
