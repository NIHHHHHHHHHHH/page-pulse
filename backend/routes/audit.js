const express = require('express');
const { fetchAndAuditUrl } = require('../services/auditService');

const router = express.Router();

router.post('/audit', async (req, res) => {
  const { url } = req.body;

  const report = await fetchAndAuditUrl(url);
  res.json(report);
});

module.exports = router;