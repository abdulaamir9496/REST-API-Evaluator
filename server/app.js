const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();
// Add this to your app/index.js file after dotenv.config()
console.log('Environment check:');
console.log(`- PORT: ${process.env.PORT ? '✅' : '❌'}`);
console.log(`- MONGO_URI: ${process.env.MONGO_URI ? '✅' : '❌'}`);
console.log(`- Auth key: ${process.env.DEFAULT_AUTH_KEY ? '✅' : '❌'}`);
console.log(`- Auth value: ${process.env.DEFAULT_AUTH_VALUE ? '✅' : '❌'}`);

const app = express();

// Middlewares
app.use(cors());               // Enable CORS for all origins
app.use(express.json());       // Parse JSON bodies

// Routes
const oasRoutes = require('./routes/oasRoutes');
app.use('/api/oas', oasRoutes);

module.exports = app;
