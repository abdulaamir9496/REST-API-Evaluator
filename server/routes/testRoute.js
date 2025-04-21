const express = require('express');
const router = express.Router();
const fs = require('fs/promises');
const path = require('path');
const axios = require('axios');
const { testDummyDataFromSpec } = require('../scripts/testRunner');

router.get('/test-dummy', async (req, res) => {
  const { spec, endpoint, method } = req.query;

  try {
    let specContent;

    if (!spec) {
      return res.status(400).json({ error: 'Spec path or URL is required' });
    }

    // Check if it's a URL or local path
    if (spec.startsWith('http://') || spec.startsWith('https://')) {
      const response = await axios.get(spec);
      specContent = response.data;
    } else {
      const specPath = path.resolve(__dirname, `../${spec}`);
      specContent = await fs.readFile(specPath, 'utf-8');
    }

    const result = await testDummyDataFromSpec(specContent, endpoint, method);
    res.json(result);
  } catch (err) {
    console.error('Failed to generate dummy data:', err.message);
    res.status(500).json({ error: 'Failed to generate dummy data' });
  }
});

module.exports = router;
