import mongoose from 'mongoose';

const pricePointSchema = new mongoose.Schema(
  { price: Number, scrapedAt: { type: Date, default: Date.now } },
  { _id: false }
);

const orderRecoSchema = new mongoose.Schema({
  action:     { type: String, default: 'À tester' },
  minUnits:   { type: Number, default: 10 },
  maxUnits:   { type: Number, default: 30 },
  confidence: { type: String, default: 'moyenne' },
  reasoning:  { type: String, default: '' },
}, { _id: false });

const trendDataSchema = new mongoose.Schema({
  googleTrend:    { type: Number, default: 50 },
  redditMentions: { type: Number, default: 0 },
  trendDirection: { type: String, enum: ['up', 'down', 'stable'], default: 'stable' },
  regionPeak:     { type: String, default: null },
}, { _id: false });

const scrapedProductSchema = new mongoose.Schema({
  // ── Core scraped fields ──────────────────────────────────────────────────────
  title:         { type: String, required: true },
  price:         { type: Number },
  originalPrice: { type: Number },
  discountPct:   { type: Number, default: 0 },
  source:        { type: String, required: true },
  country:       { type: String, default: 'ma' },
  shopifyStore:  { type: String },
  currency:      { type: String, default: 'MAD' }, // native currency of the source
  url:           { type: String, required: true, unique: true },
  imageUrl:      { type: String },
  category:      { type: String },
  query:         { type: String },
  rating:        { type: Number },
  reviewCount:   { type: Number },
  soldCount:     { type: Number },     // units sold (where available)
  priceHistory:  [pricePointSchema],
  lastScraped:   { type: Date, default: Date.now },

  // ── Computed potential fields ────────────────────────────────────────────────
  potentialScore:   { type: Number, default: 50 },
  demandScore:      { type: Number, default: 50 },
  trendScore:       { type: Number, default: 50 },   // Google Trends + Reddit
  trendData:        { type: trendDataSchema, default: () => ({}) },
  competitionLevel: { type: String, default: 'Moyenne' },
  priceSpread:      { type: Number, default: 0 },
  badge:            { type: String, enum: ['trending', 'bestseller', 'opportunity', null], default: null },
  statusColor:      { type: String, enum: ['red', 'orange', 'green'], default: 'orange' },
  orderReco:        { type: orderRecoSchema, default: () => ({}) },

  aiScore: { type: Number, default: 50 }, // backward compat alias
}, { timestamps: true });

scrapedProductSchema.index({ query: 1, source: 1 });
scrapedProductSchema.index({ potentialScore: -1 });
scrapedProductSchema.index({ query: 1, potentialScore: -1 });
scrapedProductSchema.index({ country: 1, potentialScore: -1 });
scrapedProductSchema.index({ trendScore: -1 });

export default mongoose.model('ScrapedProduct', scrapedProductSchema);
