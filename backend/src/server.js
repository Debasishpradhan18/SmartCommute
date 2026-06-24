const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db.js');
const authRoutes = require('./routes/auth.js');
const commuteRoutes = require('./routes/commute.js');
const ridesRoutes = require('./routes/rides.js');
const parkingRoutes = require('./routes/parking.js');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/commute', commuteRoutes);
app.use('/api/rides', ridesRoutes);
app.use('/api/parking', parkingRoutes);

// Error handling middleware to ensure JSON responses on failure
app.use((err, req, res, next) => {
  console.error('💥 Server Error:', err);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

// Simple Status Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Start Function
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 SmartCommute backend running on http://localhost:${PORT}`);
  });
};

startServer();
