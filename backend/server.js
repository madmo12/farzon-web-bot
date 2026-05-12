require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const path = require('path');
const cors = require('cors');
const connectDB = require('./config/db');
const chatRoutes = require('./routes/chat');
const statsRoutes = require('./routes/stats');
const adminRoutes = require('./routes/admin');

// Connect to Database (cached for serverless reuse)
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', chatRoutes);
app.use('/api', statsRoutes);

// Debug: inline test route
app.get('/api/admin/test', (req, res) => res.json({ ok: true }));

app.use('/api/admin', adminRoutes);

// Serve admin dashboard static files
app.use('/admin-farzon', express.static(path.join(__dirname, '..', 'admin')));

// Local development only — Vercel handles its own HTTP layer
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export for Vercel serverless
module.exports = app;
