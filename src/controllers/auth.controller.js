const db = require('../models/db')
const bcrypt = require('bcrypt')
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
    const data = await registerSchema.validateAsync(req.body)

    const existing = await db.query('SELECT * FROM users WHERE id_number = $1', [data.id_number])
    if (existing.rowCount > 0) return res.status(400).json({ message: 'ID already exists' })

    // Get county & sub-county IDs
    const countyRes = await db.query('SELECT county_id FROM counties WHERE county_name = $1', [data.county])
    const subCountyRes = await db.query('SELECT sub_county_id FROM sub_counties WHERE sub_county_name = $1', [data.sub_county])
    if (countyRes.rowCount === 0 || subCountyRes.rowCount === 0)
      return res.status(400).json({ message: 'Invalid county or sub-county' })

    const county_id = countyRes.rows[0].county_id
    const sub_county_id = subCountyRes.rows[0].sub_county_id
    const { latitude, longitude } = data

    const hashed = await bcrypt.hash(data.password, 10)

    const userRes = await db.query(
      `INSERT INTO users (
        first_name, last_name, id_number, gender, role, password,
        location, county_id, sub_county_id
      ) VALUES ($1, $2, $3, $4, $5, $6, ST_GeogPoint($7, $8), $9, $10)
      RETURNING id, role`,
      [
        data.first_name,
        data.last_name,
        data.id_number,
        data.gender,
        data.role,
        hashed,
        longitude,
        latitude,
        county_id,
        sub_county_id,
      ]
    )

    const user = userRes.rows[0]

    // If farmer, insert into farmers table
    if (data.role === 'farmer') {
      await db.query(
        `INSERT INTO farmers (user_id, mode_of_payment) VALUES ($1, $2)`,
        [user.id, data.mode_of_payment || 'M-PESA']
      )
    }

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
    console.error(err)
    res.status(400).json({ message: err.message })
  }
}

// LOGIN
exports.login = async (req, res) => {
  try {
    const data = await loginSchema.validateAsync(req.body)

    const result = await db.query('SELECT * FROM users WHERE id_number = $1', [data.id_number])
    if (result.rowCount === 0) return res.status(404).json({ message: 'User not found' })

    const user = result.rows[0]
    const match = await bcrypt.compare(data.password, user.password)
    if (!match) return res.status(401).json({ message: 'Incorrect password' })

    const token = signToken({ id: user.id, role: user.role })

    res
      .cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 3600000,
      })
      .json({ message: 'Login successful', role: user.role })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// SESSION
exports.getMe = async (req, res) => {
  const userRes = await db.query(
    `SELECT 
        u.id, u.first_name, u.last_name, u.id_number, u.role, u.gender,
        c.county_name, s.sub_county_name
     FROM users u
     LEFT JOIN counties c ON u.county_id = c.county_id
     LEFT JOIN sub_counties s ON u.sub_county_id = s.sub_county_id
     WHERE u.id = $1`,
    [req.user.id]
  )

  if (!userRes.rowCount) return res.status(404).json({ message: 'User not found' })

  res.json(userRes.rows[0])
}

// REFRESH TOKEN
exports.refresh = (req, res) => {
  const token = req.cookies.token
  if (!token) return res.status(401).json({ message: 'No token provided' })

  try {
    const decoded = require('../utils/jwt').verifyToken(token)
    const newToken = require('../utils/jwt').signToken({ id: decoded.id, role: decoded.role })

    res.cookie('token', newToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 3600000,
    }).json({ message: 'Token refreshed' })
  } catch (err) {
    console.error(err)
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
    const result = await db.query('SELECT * FROM users WHERE id_number = $1', [id_number])
    if (!result.rowCount) return res.status(404).json({ message: 'ID not found' })
    res.json({ message: 'ID exists' })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

exports.resetStep2 = async (req, res) => {
  try {
    const { id_number, phone, name } = await resetStep2.validateAsync(req.body)
    const [first, last] = name.trim().split(' ')

    const result = await db.query(
      `SELECT * FROM users WHERE id_number = $1 AND first_name ILIKE $2 AND last_name ILIKE $3`,
      [id_number, `%${first}%`, `%${last || ''}%`]
    )

    if (!result.rowCount) return res.status(401).json({ message: 'Identity mismatch' })
    res.json({ message: 'Verified' })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

exports.resetFinal = async (req, res) => {
  try {
    const { id_number, password } = await resetFinal.validateAsync(req.body)
    const hashed = await bcrypt.hash(password, 10)
    await db.query('UPDATE users SET password = $1 WHERE id_number = $2', [hashed, id_number])
    res.json({ message: 'Password updated' })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}
