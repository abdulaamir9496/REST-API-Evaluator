// routes/oasRoutes.js
const express = require('express');
const router = express.Router();
const { testOAS, retryEndpoint, updateAuthConfig } = require('../controllers/oasController');

// Tests an OpenAPI Specification (OAS) and returns a summary of the results.
router.post('/test', testOAS);

// Retries an endpoint with the given URL, method, and data.
router.post('/retry', retryEndpoint);

// Updates auth configuration settings
router.post('/auth-config', updateAuthConfig);

module.exports = router;
