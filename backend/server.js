require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const connectDB = require('./config/db');
const chatRoutes = require('./routes/chat');
const statsRoutes = require('./routes/stats');
const adminRoutes = require('./routes/admin');

// Connect to Database
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

console.log('Admin routes type:', typeof adminRoutes);
app.use('/api/admin', adminRoutes);

// Serve admin dashboard static files
app.use('/admin-farzon', express.static(path.join(__dirname, '..', 'admin')));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
