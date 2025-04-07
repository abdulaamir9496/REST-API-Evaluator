const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// Middlewares
app.use(cors());               // Enable CORS for all origins
app.use(express.json());       // Parse JSON bodies

// Routes
const oasRoutes = require('./routes/oasRoutes');
app.use('/api/oas', oasRoutes);

module.exports = app;
