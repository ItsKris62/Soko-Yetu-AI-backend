const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 8000

app.use(cors({ origin: 'http://localhost:3000', credentials: true }))
app.use(express.json())
app.use(cookieParser())

// Routes
app.use('/api/auth', require('./routes/auth.routes'))
app.use('/api/auth', require('./routes/auth.routes'))
app.use('/api/users', require('./routes/user.routes'))
app.use('/api/produce', require('./routes/produce.routes.js'))
app.use('/api/location', require('./routes/location.routes.js'))



app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
