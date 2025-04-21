// models/ConstructionReport.js
const mongoose = require('mongoose');

const constructionReportSchema = new mongoose.Schema({
  location: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  coordinates: {
    lat: Number,
    lng: Number
  },
  reportTime: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  moderationResult: {
    flagged: Boolean,
    categories: Object,
    score: Number
  }
});

// Check if the model is already defined to prevent overwriting during hot reloads
const ConstructionReport = mongoose.models.ConstructionReport || 
  mongoose.model('ConstructionReport', constructionReportSchema);

module.exports = ConstructionReport;
