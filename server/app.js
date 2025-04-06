const express = require('express');
const cors = require('cors');
const oasRoutes = require('./routes/oasRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/oas', oasRoutes);

module.exports = app;
