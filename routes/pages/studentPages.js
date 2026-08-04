/**
 * Page Routes: Student Dashboard & Registration Views
 */

const express = require('express');
const router = express.Router();
const HFRSEngine = require('../../engine/hfrsEngine');
const { isStudent } = require('../../middleware/authMiddleware');

router.use(isStudent);

// GET /student/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const summary = await HFRSEngine.getStudentRegistrationSummary(userId);

    res.render('pages/student-dashboard', {
      pageTitle: 'UniRegister - Student Dashboard',
      activePage: 'dashboard',
      user: req.session.user,
      profile: summary.profile,
      registration: summary.registration,
      payment: summary.payment,
      documents: summary.documents
    });
  } catch (err) {
    res.status(500).render('500', { pageTitle: 'Error', error: err.message });
  }
});

// GET /student/registration (Step-by-step Registration Flow)
router.get('/registration', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const summary = await HFRSEngine.getStudentRegistrationSummary(userId);
    const step = parseInt(req.query.step || '1', 10);

    res.render('pages/student-registration', {
      pageTitle: 'UniRegister - Complete Registration Form',
      activePage: 'registration',
      user: req.session.user,
      profile: summary.profile,
      registration: summary.registration,
      payment: summary.payment,
      documents: summary.documents,
      currentStep: step
    });
  } catch (err) {
    res.status(500).render('500', { pageTitle: 'Error', error: err.message });
  }
});

// GET /student/status (Real-time Status Tracking Page)
router.get('/status', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const summary = await HFRSEngine.getStudentRegistrationSummary(userId);

    res.render('pages/student-status', {
      pageTitle: 'UniRegister - Real-Time Status Tracking',
      activePage: 'status',
      user: req.session.user,
      profile: summary.profile,
      registration: summary.registration,
      payment: summary.payment,
      documents: summary.documents
    });
  } catch (err) {
    res.status(500).render('500', { pageTitle: 'Error', error: err.message });
  }
});

module.exports = router;
