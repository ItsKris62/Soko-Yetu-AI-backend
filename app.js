// app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
const { Server } = require('socket.io');
const http = require('http');
const auditMiddleware = require('./src/middleware/auditMiddleware');
const { errorHandler } = require('./src/middleware/errorHandler');
const { socketService } = require('./src/services/socketService');
require('./src/config/passport'); // Passport JWT setup
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000' },
});

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests
  })
);

app.use(auditMiddleware); // Log all HTTP requests

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/categories', require('./src/routes/categories'));
app.use('/api/products', require('./src/routes/products'));
app.use('/api/orders', require('./src/routes/orders'));
app.use('/api/community', require('./src/routes/community'));
app.use('/api/messages', require('./src/routes/messages'));
app.use('/api/ai', require('./src/routes/ai'));
app.use('/api/feedback', require('./src/routes/feedback'));
app.use('/api/ratings', require('./src/routes/ratings'));
app.use('/api/audit', require('./src/routes/audit'));
app.use('/api/locations', require('./src/routes/locations'));

// Socket.IO for real-time messaging
socketService(io);

// Error Handling
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});