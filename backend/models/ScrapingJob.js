import mongoose from 'mongoose';

const scrapingJobSchema = new mongoose.Schema({
  sources:       { type: [String], default: ['jumia', 'avito'] },
  query:         { type: String, required: true },
  country:       { type: String, default: 'ma' },
  status:        { type: String, enum: ['running', 'completed', 'failed'], default: 'running' },
  productsFound: { type: Number, default: 0 },
  newProducts:   { type: Number, default: 0 },
  error:         { type: String },
  startedAt:     { type: Date, default: Date.now },
  completedAt:   { type: Date },
}, { timestamps: true });

export default mongoose.model('ScrapingJob', scrapingJobSchema);
