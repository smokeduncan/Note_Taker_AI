const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const winston = require('winston');

// Load environment variables
dotenv.config();

// Import controllers
const apiController = require('./controllers/apiController');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'server' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Initialize Express app
const app = express();

// Middleware
app.use(helmet({ contentSecurityPolicy: false })); // Disable CSP for SSE
app.use(compression()); // Compress responses
app.use(express.json({ limit: '50mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Parse URL-encoded bodies
app.use(cors()); // Enable CORS

// Logging middleware in development mode
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/note_taker_ai', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Initialize API controller
const initResult = apiController.initialize();
logger.info(`API Controller initialized: ${JSON.stringify(initResult)}`);

// Authentication middleware
const authenticate = (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('x-auth-token');
    
    // Check if no token
    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultsecret');
    
    // Add user to request
    req.user = decoded.user;
    next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    res.status(401).json({ error: 'Token is not valid' });
  }
};

// Public routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Note Taker AI API' });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '0.1.0'
  });
});

// AG-UI Stream routes
app.get('/api/stream/:threadId', apiController.handleStreamConnection);

// Protected routes
// Note: In a production app, these would be protected with the authenticate middleware
// For now, we're leaving them open for easier testing

// Note processing routes
app.post('/api/notes/process', apiController.processNote);
app.post('/api/notes/email-draft', apiController.generateEmailDraft);
app.post('/api/notes/schedule-meeting', apiController.scheduleMeeting);
app.post('/api/notes/chat', apiController.chatWithAI);
app.post('/api/notes/sync-sap', apiController.syncWithSAP);

// Stream interaction routes
app.post('/api/stream/input', apiController.sendUserInput);
app.post('/api/stream/cancel', apiController.cancelStream);
app.get('/api/stream/:threadId/status', apiController.getStreamStatus);

// MCP server routes
app.get('/api/mcp/servers', apiController.listMCPServers);
app.get('/api/mcp/servers/:serverName/tools', apiController.listMCPTools);
app.post('/api/mcp/execute', apiController.executeMCPTool);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('client/build'));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

// 404 handler
app.use((req, res) => {
  logger.warn(`Route not found: ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Server error: ${err.message}`, { 
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });
  
  res.status(500).json({
    error: 'Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Set port
const PORT = process.env.PORT || 5000;

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`, { stack: err.stack });
  // Don't crash the server in production
  if (process.env.NODE_ENV !== 'production') {
    server.close(() => process.exit(1));
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
  // Don't crash the server in production
  if (process.env.NODE_ENV !== 'production') {
    server.close(() => process.exit(1));
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

module.exports = server;
