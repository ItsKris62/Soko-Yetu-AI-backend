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
const socketService = require('./src/services/socketService');


const fileUpload = require('express-fileupload');
const uploadRoutes = require('./src/routes/upload'); // Import the upload routes

require('./src/config/passport'); // Passport JWT setup
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000' },
  credentials: true, // Allow credentials
});

// CORS Options
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true, // <-- Important for cookies, authorization headers with JWTs
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Middleware
app.use(helmet());
app.use(cors(corsOptions)); // Use configured CORS middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(passport.initialize());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests
  })
);

app.use(auditMiddleware); // Log all HTTP requests


// File upload middleware
app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  abortOnLimit: true,
}));

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/categories', require('./src/routes/categories'));
app.use('/api/predefined-products', require('./src/routes/predefined_products'));
app.use('/api/products', require('./src/routes/products'));
app.use('/api/orders', require('./src/routes/orders'));
app.use('/api/community', require('./src/routes/community'));
app.use('/api/messages', require('./src/routes/messages'));
app.use('/api/marketplace', require('./src/routes/marketplace'));
app.use('/api/ai', require('./src/routes/ai'));
app.use('/api/feedback', require('./src/routes/feedback'));
app.use('/api/ratings', require('./src/routes/ratings'));
app.use('/api/audit', require('./src/routes/audit'));
app.use('/api/locations', require('./src/routes/location'));
app.use('/api/upload', uploadRoutes);
app.use('/api/resources', require('./src/routes/resources'));

// Socket.IO for real-time messaging
socketService.init(server);

// Error Handling
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});