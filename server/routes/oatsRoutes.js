const express = require("express");
const router = express.Router();
const { testOAS } = require("../controllers/oasController");

router.post("/test", testOAS);

module.exports = router;
