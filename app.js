/**
 * UniRegister (hfrs-) - Unified Freshers Registration System
 * Main Express Application Entry Point
 */

const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const db = require('./config/database');

// Import Route Handlers
const authPages = require('./routes/pages/authPages');
const studentPages = require('./routes/pages/studentPages');
const adminPages = require('./routes/pages/adminPages');

const authApi = require('./routes/api/authApi');
const studentApi = require('./routes/api/studentApi');
const adminApi = require('./routes/api/adminApi');
const reportsApi = require('./routes/api/reportsApi');

const app = express();
const PORT = process.env.PORT || 3000;

// View Engine Setup (EJS)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Assets & Uploads
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Session Configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'unicross_hfrs_secret_key_2026_super_secure',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
}));

// Make currentUser available to all EJS view templates
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// Root Route Redirect
app.get('/', (req, res) => {
  if (req.session && req.session.user) {
    if (req.session.user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    }
    return res.redirect('/student/dashboard');
  }
  return res.redirect('/auth/login');
});

// Mount Page Routes
app.use('/auth', authPages);
app.use('/student', studentPages);
app.use('/admin', adminPages);

// Mount Separated JSON API Routes
app.use('/api/auth', authApi);
app.use('/api/student', studentApi);
app.use('/api/admin', adminApi);
app.use('/api/reports', reportsApi);

// 404 Handler
app.use((req, res) => {
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({ success: false, error: 'API endpoint not found.' });
  }
  res.status(404).render('404', { pageTitle: 'Page Not Found', error: 'The requested route does not exist.' });
});

// 500 Global Error Handler
app.use((err, req, res, next) => {
  console.error('[UniRegister Server Error]', err.stack);
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
  }
  res.status(500).render('500', { pageTitle: 'Server Error', error: err.message });
});

// Start Server & Test Database Connection
app.listen(PORT, async () => {
  console.log(`===========================================================`);
  console.log(`🚀 UniRegister System Server listening on port ${PORT}`);
  console.log(`🌐 Application URL: http://localhost:${PORT}`);
  console.log(`===========================================================`);

  // Initialize DB Connection
  await db.initDatabase();
});

module.exports = app;
