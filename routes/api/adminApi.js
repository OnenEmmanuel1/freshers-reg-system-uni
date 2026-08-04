/**
 * JSON API Routes: Administrative Module
 */

const express = require('express');
const router = express.Router();
const HFRSEngine = require('../../engine/hfrsEngine');
const { isAdmin } = require('../../middleware/authMiddleware');

// Ensure admin authorization
router.use(isAdmin);

// GET /api/admin/pending
router.get('/pending', async (req, res) => {
  try {
    const { search, faculty, department } = req.query;
    const queue = await HFRSEngine.adminGetPendingQueue({ search, faculty, department });
    return res.json({ success: true, count: queue.length, data: queue });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/verify-payment
router.post('/verify-payment', async (req, res) => {
  try {
    const adminUserId = req.session.user.id;
    const { registration_id, status } = req.body;
    if (!registration_id) {
      return res.status(400).json({ success: false, error: 'Registration ID is required.' });
    }
    const result = await HFRSEngine.adminVerifyPayment(adminUserId, registration_id, status || 'confirmed');
    return res.json({ success: true, message: result.message });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/admin/approve
router.post('/approve', async (req, res) => {
  try {
    const adminUserId = req.session.user.id;
    const { registration_id } = req.body;
    if (!registration_id) {
      return res.status(400).json({ success: false, error: 'Registration ID is required.' });
    }
    const result = await HFRSEngine.adminApproveRegistration(adminUserId, registration_id);
    return res.json({ success: true, message: result.message });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message.replace(/^PAYMENT_UNCONFIRMED:\s*/, '')
    });
  }
});

// POST /api/admin/reject
router.post('/reject', async (req, res) => {
  try {
    const adminUserId = req.session.user.id;
    const { registration_id, reason } = req.body;
    if (!registration_id) {
      return res.status(400).json({ success: false, error: 'Registration ID is required.' });
    }
    const result = await HFRSEngine.adminRejectRegistration(adminUserId, registration_id, reason);
    return res.json({ success: true, message: result.message });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/admin/records
router.get('/records', async (req, res) => {
  try {
    const { search, status, faculty, department } = req.query;
    const records = await HFRSEngine.adminSearchStudentRecords({ search, status, faculty, department });
    return res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
