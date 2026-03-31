const mongoose = require('mongoose');

// Developer-maintained dataset for AI classification
const moduleDatasetSchema = new mongoose.Schema({
  moduleCode:  { type: String, required: true, unique: true },
  moduleName:  { type: String, required: true },
  keywords:    [{ type: String }],
  semester:    { type: Number, min: 1, max: 8 },
  year:        { type: Number, min: 1, max: 4 },
  department:  { type: String },
  isActive:    { type: Boolean, default: true },
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('ModuleDataset', moduleDatasetSchema);
