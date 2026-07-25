const express = require('express');
const { fetchAndAuditUrl } = require('../services/auditService');

const router = express.Router();

const ERROR_STATUS_MAP = {
  INVALID_URL: 400,
  BLOCKED_HOST: 400,
  DNS_FAILURE: 422,
  TIMEOUT: 504,
  FETCH_FAILED: 502
};

router.post('/audit', async (req, res) => {
  try {
    const report = await fetchAndAuditUrl(req.body.url);
    res.json(report);
  } catch (err) {
    const status = ERROR_STATUS_MAP[err.code] || 500;
    res.status(status).json({
      error: err.code || 'UNKNOWN_ERROR',
      message: err.message
    });
  }
});

module.exports = router;