const express = require('express');
const router = express.Router();
const oasController = require('../controllers/oasController');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml'); // Required to parse YAML
const { testDummyDataFromSpec } = require('../scripts/testRunner');

// ✅ Utility function to load spec file (JSON or YAML)
async function loadSpecFile(filePath) {
  // Check if the filePath is a URL
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      try {
          const response = await axios.get(filePath);
          return response.data; // Return the fetched data
      } catch (error) {
          throw new Error(`Error fetching spec from URL: ${error.message}`);
      }
  }

  // If it's a local file, read it
  const ext = path.extname(filePath);
  const content = fs.readFileSync(filePath, 'utf8');

  if (ext === '.yaml' || ext === '.yml') {
      return yaml.load(content);
  } else if (ext === '.json') {
      return JSON.parse(content);
  } else {
      throw new Error('Unsupported file format. Only .json, .yaml, and .yml are supported.');
  }
}

// ✅ Routes
router.post('/test', oasController.testOAS);
router.post('/retry', oasController.retryEndpoint);
router.post('/auth', oasController.updateAuthConfig);
router.get('/auth', oasController.listAuthConfigs);
router.get('/auth/:name', oasController.getAuthConfig);
router.delete('/auth/:name', oasController.deleteAuthConfig);

// ✅ List available specs
router.get('/available-specs', (req, res) => {
  const specsDir = path.join(__dirname, '../specs');

  fs.readdir(specsDir, (err, files) => {
    if (err) {
      console.error('Error reading specs directory:', err);
      return res.status(500).json({ error: 'Failed to read available specs.' });
    }

    const specs = files.filter(file => file.endsWith('.yaml') || file.endsWith('.json'));
    res.json(specs);
  });
});

// ✅ Fetch endpoints from selected spec
router.get('/endpoints', async (req, res) => {
  const { spec } = req.query;
  const specPath = path.join(__dirname, `../specs/${spec}`);

  try {
    const specData = await loadSpecFile(specPath); // Await the loadSpecFile function

    const endpoints = Object.keys(specData.paths).map((path) => ({
      path,
      methods: Object.keys(specData.paths[path]),
    }));

    res.json(endpoints);
  } catch (err) {
    console.error('Error reading spec file:', err);
    res.status(500).json({ error: 'Failed to load endpoints' });
  }
});

// ✅ Test dummy data generation
router.get('/test-dummy', async (req, res) => {
  try {
    const specName = req.query.spec || 'github.yaml';
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