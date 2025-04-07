const express = require('express');
const router = express.Router();
const { testOAS, retryEndpoint } = require('../controllers/oasController');

router.post('/test', testOAS);
router.post('/retry', retryEndpoint);

module.exports = router;
