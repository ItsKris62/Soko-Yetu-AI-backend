//test route import
// import testRoutes from './src/routes/test.routes.js';

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
app.use('/api/auth', require('./src/routes/auth.routes.js'))
app.use('/api/users', require('./src/routes/user.routes.js'))
app.use('/api/produce', require('./src/routes/produce.routes.js'))
app.use('/api/location', require('./src/routes/location.routes.js'))

//test route
// app.use('/api', testRoutes)



app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
