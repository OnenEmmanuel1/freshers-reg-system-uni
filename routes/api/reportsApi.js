/**
 * JSON API Routes: Reporting & Analytics
 */

const express = require('express');
const router = express.Router();
const HFRSEngine = require('../../engine/hfrsEngine');
const { isAdmin } = require('../../middleware/authMiddleware');

router.use(isAdmin);

// GET /api/reports/analytics
router.get('/analytics', async (req, res) => {
  try {
    const metrics = await HFRSEngine.adminGetReportsAndAnalytics();
    return res.json({ success: true, ...metrics });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/reports/csv
router.get('/csv', async (req, res) => {
  try {
    const csvContent = await HFRSEngine.adminGenerateCSV();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=unicross_freshers_registrations_${Date.now()}.csv`);
    return res.status(200).send(csvContent);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
