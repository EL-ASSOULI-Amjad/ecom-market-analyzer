import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  revenue:  { type: Number, required: true },
  products: { type: Number, required: true },
  rating:   { type: Number, min: 0, max: 5 },
  status:   { type: String, enum: ['active', 'inactive', 'pending'], default: 'active' },
});

export default mongoose.model('Store', storeSchema);
