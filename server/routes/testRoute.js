const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { testDummyDataFromSpec } = require('../scripts/testRunner');

router.get('/test-dummy', async (req, res) => {
  const specPath = path.join(__dirname, '../testSpecs/github.yaml');
  const endpoint = '/user/repos';
  const method = 'post';

  try {
    const result = await testDummyDataFromSpec(specPath, endpoint, method);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate dummy data' });
  }
});

module.exports = router;
