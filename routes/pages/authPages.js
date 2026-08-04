/**
 * Page Routes: Authentication Views
 */

const express = require('express');
const router = express.Router();

// GET /auth/login
router.get('/login', (req, res) => {
  if (req.session && req.session.user) {
    if (req.session.user.role === 'admin') return res.redirect('/admin/dashboard');
    return res.redirect('/student/dashboard');
  }
  
  const error = req.query.error || null;
  const success = req.query.success || null;

  res.render('pages/login', {
    pageTitle: 'UniRegister - Login',
    activePage: 'login',
    error,
    success
  });
});

// GET /auth/register
router.get('/register', (req, res) => {
  if (req.session && req.session.user) {
    if (req.session.user.role === 'admin') return res.redirect('/admin/dashboard');
    return res.redirect('/student/dashboard');
  }

  const error = req.query.error || null;

  res.render('pages/register', {
    pageTitle: 'UniRegister - Fresher Account Registration',
    activePage: 'register',
    error
  });
});

// ALL /auth/logout (Direct page logout route)
router.all('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      res.clearCookie('connect.sid');
      return res.redirect('/auth/login?success=Logged out successfully.');
    });
  } else {
    return res.redirect('/auth/login');
  }
});

module.exports = router;
