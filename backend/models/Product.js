import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  category:     { type: String, required: true },
  price:        { type: Number, required: true },
  demand_score: { type: Number, min: 0, max: 100 },
  ai_score:     { type: Number, min: 0, max: 100 },
  stock:        { type: Number, default: 0 },
  trend:        { type: [Number], default: [] },
  badge:        { type: String, enum: ['Trending', 'Best-seller', 'Opportunity', null], default: null },
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
