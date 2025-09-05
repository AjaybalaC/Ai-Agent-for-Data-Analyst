const mongoose = require('mongoose');

const querySchema = new mongoose.Schema({
  userQuery: { type: String, required: true },
  collectedData: { type: Array, default: [] },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['success', 'failed'], default: 'success' },
});

module.exports = mongoose.model('Query', querySchema);