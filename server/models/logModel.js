const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  endpoint: String,
  method: String,
  request: Object,
  response: Object,
  timestamp: Date
});

module.exports = mongoose.model('Log', logSchema);
