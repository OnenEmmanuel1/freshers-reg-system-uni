/**
 * Authentication and Authorization Middleware
 */

function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    res.locals.currentUser = req.session.user;
    return next();
  }
  
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(401).json({ success: false, error: 'UNAUTHORIZED: Please log in to access this resource.' });
  }
  
  return res.redirect('/auth/login?error=Please log in first.');
}

function isStudent(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'student') {
    res.locals.currentUser = req.session.user;
    return next();
  }
  
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(403).json({ success: false, error: 'FORBIDDEN: Student access only.' });
  }
  
  return res.redirect('/auth/login?error=Access restricted to registered students.');
}

function isAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    res.locals.currentUser = req.session.user;
    return next();
  }
  
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(403).json({ success: false, error: 'FORBIDDEN: Administrator access required.' });
  }
  
  return res.redirect('/auth/login?error=Administrator privileges required.');
}

module.exports = {
  isAuthenticated,
  isStudent,
  isAdmin
};
