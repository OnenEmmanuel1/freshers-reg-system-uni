/**
 * JSON API Routes: Authentication
 */

const express = require('express');
const router = express.Router();
const HFRSEngine = require('../../engine/hfrsEngine');

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const result = await HFRSEngine.createStudentAccount({ name, email, password });
    
    // Auto login
    req.session.user = {
      id: result.userId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role: 'student',
      applicationNumber: result.applicationNumber
    };

    return res.json({
      success: true,
      message: 'Account created successfully! Welcome to UNICROSS Freshers Registration System.',
      redirectUrl: '/student/dashboard'
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message.replace(/^DUPLICATE_EMAIL:\s*/, '')
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await HFRSEngine.authenticateUser({ email, password });

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    const redirectUrl = user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard';

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      user: req.session.user,
      redirectUrl
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: err.message.replace(/^INVALID_CREDENTIALS:\s*/, '')
    });
  }
});

// ALL /api/auth/logout (Supports both AJAX JSON responses and standard browser form redirects)
router.all('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      res.clearCookie('connect.sid');
      if (err) {
        if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
          return res.status(500).json({ success: false, error: 'Could not log out.' });
        }
        return res.redirect('/auth/login?error=Could not log out.');
      }

      if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.json({ success: true, message: 'Logged out successfully.', redirectUrl: '/auth/login' });
      }

      return res.redirect('/auth/login?success=Logged out successfully.');
    });
  } else {
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.json({ success: true, message: 'Logged out successfully.', redirectUrl: '/auth/login' });
    }
    return res.redirect('/auth/login');
  }
});

module.exports = router;
