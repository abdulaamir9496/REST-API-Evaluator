const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

// Database connection
const {
    PORT,
    MONGO_URI,
    DEFAULT_AUTH_KEY,
    DEFAULT_AUTH_VALUE,
} = require("./config/constants");

// Environment validation log
console.log("🌐 Environment check:");
console.log(`- PORT: ${PORT ? "✅" : "❌"}`);
console.log(`- MONGO_URI: ${MONGO_URI ? "✅" : "❌"}`);
console.log(`- DEFAULT_AUTH_KEY: ${DEFAULT_AUTH_KEY ? "✅" : "❌"}`);
console.log(`- DEFAULT_AUTH_VALUE: ${DEFAULT_AUTH_VALUE ? "✅" : "❌"}`);

const app = express();

// Middlewares
app.use(cors());    // Enable CORS for all origins
app.use(express.json());   // Parse JSON bodies

// Routes
const oasRoutes = require("./routes/oasRoutes");
app.use("/api/oas", oasRoutes); // This already handles the /test-dummy route

module.exports = app;
