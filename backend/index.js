const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'page-pulse-backend' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Page Pulse backend running on port ${PORT}`));