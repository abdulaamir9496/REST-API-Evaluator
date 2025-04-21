const express = require('express');
const router = express.Router();
const {
    testOAS,
    retryEndpoint,
    updateAuthConfig
} = require('../controllers/oasController');

const path = require('path');
const { testDummyDataFromSpec } = require('../scripts/testRunner');

// Existing routes
router.post('/test', testOAS);
router.post('/retry', retryEndpoint);
router.post('/auth-config', updateAuthConfig);

// ✅ New test route for dummy data generation from OpenAPI spec
router.get('/test-dummy', async (req, res) => {
    try {
        const specName = req.query.spec || 'github.yaml'; // Default to github.yaml
        const endpoint = req.query.endpoint || '/user/repos';
        const method = req.query.method || 'post';

        const specPath = path.join(__dirname, `../specs/${specName}`);
        const result = await testDummyDataFromSpec(specPath, endpoint, method);
        res.json(result);
    } catch (err) {
        console.error('Dummy data generation failed:', err);
        res.status(500).json({ error: 'Failed to generate dummy data' });
    }
});

module.exports = router;
