import mongoose from 'mongoose';

const kpiSchema = new mongoose.Schema({
  total_revenue:    { type: Number, required: true },
  revenue_change:   { type: Number, required: true },
  active_products:  { type: Number, required: true },
  products_change:  { type: Number, required: true },
  avg_score:        { type: Number, required: true },
  score_change:     { type: Number, required: true },
  top_category:     { type: String, required: true },
}, { timestamps: true });

export default mongoose.model('KpiMetrics', kpiSchema);
