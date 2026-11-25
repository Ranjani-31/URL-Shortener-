const mongoose = require('mongoose');

const clickSchema = new mongoose.Schema({
  linkId: { type: mongoose.Schema.Types.ObjectId, ref: 'Url', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  visitorHash: { type: String, default: null },
  country: { type: String, default: 'Unknown' },
  device: { type: String, default: 'Desktop' },
  browser: { type: String, default: 'Unknown' },
  referrer: { type: String, default: 'Direct' },
}, { timestamps: true });

module.exports = mongoose.model('Click', clickSchema);