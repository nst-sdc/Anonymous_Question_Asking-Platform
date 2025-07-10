const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Load .env variables
require('./database'); // Initialize Supabase

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/rooms', require('./routes/roomRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// Health check
app.get('/', (req, res) => {
  res.send('✅ API is running with Supabase');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

module.exports = app;
