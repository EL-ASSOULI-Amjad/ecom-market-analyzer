import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  title:  { type: String, required: true },
  date:   { type: String, required: true },
  type:   { type: String, required: true },
  status: { type: String, enum: ['ready', 'processing', 'failed'], default: 'ready' },
}, { timestamps: true });

export default mongoose.model('Report', reportSchema);
