/**
 * JSON API Routes: Student Module
 */

const express = require('express');
const router = express.Router();
const HFRSEngine = require('../../engine/hfrsEngine');
const { isStudent } = require('../../middleware/authMiddleware');
const upload = require('../../middleware/uploadMiddleware');

// Ensure student authorization for all /api/student/* endpoints
router.use(isStudent);

// POST /api/student/profile
router.post('/profile', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const result = await HFRSEngine.saveStudentProfile(userId, req.body);
    return res.json({ success: true, message: result.message });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message.replace(/^(VALIDATION_ERROR|DUPLICATE_REGISTRATION):\s*/, '')
    });
  }
});

// POST /api/student/payment
router.post('/payment', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const amount = parseFloat(req.body.amount || 25000.00);
    const result = await HFRSEngine.processSimulatedPayment(userId, { amount });
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/student/upload
router.post('/upload', (req, res) => {
  upload.single('documentFile')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message || 'Error uploading file.'
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please select a file to upload.' });
    }

    try {
      const userId = req.session.user.id;
      const document_type = req.body.document_type;
      
      const fileData = {
        document_type,
        filename: req.file.originalname,
        storage_path: `/uploads/${req.file.filename}`,
        file_size: req.file.size,
        mime_type: req.file.mimetype
      };

      const result = await HFRSEngine.saveUploadedDocument(userId, fileData);
      return res.json({ success: true, message: result.message, file: fileData });
    } catch (engineErr) {
      return res.status(400).json({
        success: false,
        error: engineErr.message.replace(/^INVALID_DOCUMENT_TYPE:\s*/, '')
      });
    }
  });
});

// POST /api/student/submit
router.post('/submit', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const result = await HFRSEngine.submitRegistrationForVerification(userId);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message.replace(/^(INCOMPLETE_PROFILE|MISSING_PAYMENT|MISSING_DOCUMENTS):\s*/, '')
    });
  }
});

// GET /api/student/status (Real-time polling status endpoint)
router.get('/status', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const summary = await HFRSEngine.getStudentRegistrationSummary(userId);
    return res.json({
      success: true,
      status: summary.registration ? summary.registration.status : 'draft',
      rejection_reason: summary.registration ? summary.registration.rejection_reason : null,
      payment_status: summary.payment ? summary.payment.status : 'unpaid',
      submitted_at: summary.registration ? summary.registration.submitted_at : null,
      reviewed_at: summary.registration ? summary.registration.reviewed_at : null
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
