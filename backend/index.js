const express = require('express');
const cors = require('cors');
require('dotenv').config();

const auditRouter = require('./routes/audit');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'page-pulse-backend' });
});

app.use('/api', auditRouter);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Something went wrong.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Page Pulse backend running on port ${PORT}`));