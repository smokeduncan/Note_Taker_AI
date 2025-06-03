const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Logging middleware in development mode
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Define routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the CRM Note-Taking API' });
});

// API routes will be added here
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/accounts', require('./routes/accounts'));
// app.use('/api/notes', require('./routes/notes'));
// app.use('/api/prospects', require('./routes/prospects'));
// app.use('/api/activities', require('./routes/activities'));
// app.use('/api/ai', require('./routes/ai'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Set port
const PORT = process.env.PORT || 5000;

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = app;
