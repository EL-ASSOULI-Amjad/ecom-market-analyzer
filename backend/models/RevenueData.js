import mongoose from 'mongoose';

const revenueDataSchema = new mongoose.Schema({
  month:   { type: String, required: true },
  revenue: { type: Number, required: true },
  target:  { type: Number, required: true },
});

export default mongoose.model('RevenueData', revenueDataSchema);
