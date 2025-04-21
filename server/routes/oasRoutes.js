const express = require('express');
const Spec = require('../models/specModel');
const multer = require('multer');
const router = express.Router();
const oasController = require('../controllers/oasController');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const { testDummyDataFromSpec } = require('../scripts/testRunner');

const upload = multer({ dest: "uploads/" });

// ✅ Utility function to load spec file (JSON or YAML or remote)
async function loadSpecFile(filePath) {
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    try {
      const response = await axios.get(filePath);
      return response.data;
    } catch (error) {
      throw new Error(`Error fetching spec from URL: ${error.message}`);
    }
  }
  const ext = path.extname(filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  if (ext === '.yaml' || ext === '.yml') return yaml.load(content);
  if (ext === '.json') return JSON.parse(content);
  throw new Error('Unsupported file format. Only .json, .yaml, and .yml are supported.');
}

// Routes
router.post('/test', oasController.testOAS);
router.post('/retry', oasController.retryEndpoint);
router.post('/auth', oasController.updateAuthConfig);
router.get('/auth', oasController.listAuthConfigs);
router.get('/auth/:name', oasController.getAuthConfig);
router.delete('/auth/:name', oasController.deleteAuthConfig);

router.get("/available-specs", async (req, res) => {
  try {
    const specs = await Spec.find({});
    const specList = specs.map((s) => (s.type === "file" ? `local:${s.path}` : s.url));
    res.status(200).json(specList);
  } catch (err) {
    console.error("Fetch Specs Error:", err);
    res.status(500).json({ error: "Failed to load specs" });
  }
});

router.get('/endpoints', async (req, res) => {
  const { spec } = req.query;
  const specPath = path.join(__dirname, `../specs/${spec}`);
  try {
    const specData = await loadSpecFile(specPath);
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

// ✅ Grouped endpoints by method
router.get('/grouped-endpoints', async (req, res) => {
  const { spec } = req.query;
  let specPath = spec.startsWith('http') ? spec : path.join(__dirname, `../specs/${spec}`);
  try {
    const specData = await loadSpecFile(specPath);
    const grouped = {};
    Object.entries(specData.paths).forEach(([pathKey, methodObj]) => {
      Object.keys(methodObj).forEach((method) => {
        if (!grouped[method]) grouped[method] = [];
        grouped[method].push(pathKey);
      });
    });
    res.json(grouped);
  } catch (err) {
    console.error('Grouped Endpoint Fetch Error:', err);
    res.status(500).json({ error: 'Failed to group endpoints' });
  }
});

// ✅ Test dummy data for specific endpoint
// Test dummy data generation from spec (file or URL)
router.get('/test-dummy', async (req, res) => {
  try {
    const specIdentifier = req.query.spec || 'github.yaml'; // local file or URL
    const endpoint = req.query.endpoint || '/user/repos';
    const method = req.query.method || 'post';

    let rawSpec, specContent;

    if (specIdentifier.startsWith('http://') || specIdentifier.startsWith('https://')) {
      // Spec is a URL
      const response = await axios.get(specIdentifier);
      rawSpec = specIdentifier; // URL
      specContent = response.data;
    } else {
      // Spec is a local file
      const specPath = path.join(__dirname, `../specs/${specIdentifier}`);
      const content = fs.readFileSync(specPath, 'utf-8');
      rawSpec = specPath;

      if (specIdentifier.endsWith('.yaml') || specIdentifier.endsWith('.yml')) {
        specContent = yaml.load(content);
      } else {
        specContent = JSON.parse(content);
      }
    }

    const result = await testDummyDataFromSpec(rawSpec, specContent, endpoint, method);
    res.json(result);
  } catch (err) {
    console.error('Dummy data generation failed:', err);
    res.status(500).json({ error: err.message || 'Failed to generate dummy data' });
  }
});


// ✅ Bulk test all endpoints
router.get('/test-all', async (req, res) => {
  const { spec } = req.query;
  let specPath = spec.startsWith('http') ? spec : path.join(__dirname, `../specs/${spec}`);
  try {
    const specData = await loadSpecFile(specPath);
    const results = [];
    for (const [pathKey, methods] of Object.entries(specData.paths)) {
      for (const method of Object.keys(methods)) {
        try {
          const result = await testDummyDataFromSpec(specPath, pathKey, method);
          results.push({ path: pathKey, method, result });
        } catch (err) {
          results.push({ path: pathKey, method, error: err.message });
        }
      }
    }
    res.json(results);
  } catch (err) {
    console.error('Bulk test failed:', err);
    res.status(500).json({ error: 'Failed to bulk test' });
  }
});

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const filePath = path.join("uploads", req.file.filename);
    const spec = new Spec({ name: req.file.originalname, type: "file", path: filePath });
    await spec.save();
    res.status(200).json({ message: "File uploaded & saved successfully" });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ error: "Failed to save uploaded file" });
  }
});

router.post("/add-url", async (req, res) => {
  const { url } = req.body;
  try {
    const exists = await Spec.findOne({ url });
    if (exists) return res.status(409).json({ error: "URL already exists" });
    const spec = new Spec({ name: url, type: "url", url });
    await spec.save();
    res.status(200).json({ message: "URL saved successfully" });
  } catch (err) {
    console.error("URL Save Error:", err);
    res.status(500).json({ error: "Failed to save URL" });
  }
});

module.exports = router;
