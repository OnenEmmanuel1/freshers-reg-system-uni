/**
 * Page Routes: Administrative Dashboard & Verification Views
 */

const express = require('express');
const router = express.Router();
const HFRSEngine = require('../../engine/hfrsEngine');
const { isAdmin } = require('../../middleware/authMiddleware');
const db = require('../../config/database');

router.use(isAdmin);

// GET /admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const metrics = await HFRSEngine.adminGetReportsAndAnalytics();
    const pendingQueue = await HFRSEngine.adminGetPendingQueue({ search: '', faculty: '', department: '' });

    res.render('pages/admin-dashboard', {
      pageTitle: 'UniRegister - Admin Overview',
      activePage: 'admin-dashboard',
      user: req.session.user,
      metrics,
      pendingQueue: pendingQueue.slice(0, 5) // top 5 pending
    });
  } catch (err) {
    res.status(500).render('500', { pageTitle: 'Error', error: err.message });
  }
});

// GET /admin/verify/:id (Inspect single application detail for approval/rejection)
router.get('/verify/:id', async (req, res) => {
  try {
    const regId = req.params.id;
    
    const regs = await db.query(`
      SELECT 
        r.id as registration_id,
        r.status as registration_status,
        r.rejection_reason,
        r.submitted_at,
        r.reviewed_at,
        sp.id as student_profile_id,
        sp.application_number,
        sp.date_of_birth,
        sp.gender,
        sp.phone,
        sp.address,
        sp.faculty,
        sp.department,
        sp.state_of_origin,
        sp.lga,
        sp.next_of_kin_name,
        sp.next_of_kin_phone,
        u.id as user_id,
        u.name as student_name,
        u.email as student_email,
        p.id as payment_id,
        p.amount as payment_amount,
        p.status as payment_status,
        p.reference_encrypted as payment_ref,
        p.paid_at as payment_date,
        p.confirmed_at as payment_confirmed_at
      FROM registrations r
      JOIN student_profiles sp ON r.student_id = sp.id
      JOIN users u ON sp.user_id = u.id
      LEFT JOIN payments p ON r.id = p.registration_id
      WHERE r.id = ?
    `, [regId]);

    if (regs.length === 0) {
      return res.status(404).render('404', { pageTitle: 'Registration Not Found', error: 'Registration record not found.' });
    }

    const application = regs[0];
    const documents = await db.query('SELECT * FROM documents WHERE registration_id = ? ORDER BY uploaded_at DESC', [regId]);

    res.render('pages/admin-verify', {
      pageTitle: `Verify Application - ${application.student_name}`,
      activePage: 'admin-verify',
      user: req.session.user,
      application,
      documents
    });
  } catch (err) {
    res.status(500).render('500', { pageTitle: 'Error', error: err.message });
  }
});

// GET /admin/records (Searchable student records table)
router.get('/records', async (req, res) => {
  try {
    const { search = '', status = '', faculty = '', department = '' } = req.query;
    const records = await HFRSEngine.adminSearchStudentRecords({ search, status, faculty, department });

    res.render('pages/admin-records', {
      pageTitle: 'UniRegister - Student Records Management',
      activePage: 'admin-records',
      user: req.session.user,
      records,
      filters: { search, status, faculty, department }
    });
  } catch (err) {
    res.status(500).render('500', { pageTitle: 'Error', error: err.message });
  }
});

// GET /admin/reports (Reporting & Analytics Page)
router.get('/reports', async (req, res) => {
  try {
    const metrics = await HFRSEngine.adminGetReportsAndAnalytics();

    res.render('pages/admin-reports', {
      pageTitle: 'UniRegister - Reports & Analytics',
      activePage: 'admin-reports',
      user: req.session.user,
      metrics
    });
  } catch (err) {
    res.status(500).render('500', { pageTitle: 'Error', error: err.message });
  }
});

module.exports = router;
