import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Product from '../models/Product.js';
import KpiMetrics from '../models/KpiMetrics.js';
import RevenueData from '../models/RevenueData.js';
import Category from '../models/Category.js';
import Store from '../models/Store.js';
import Report from '../models/Report.js';

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '../.env') });

const products = [
  { name: 'Wireless Earbuds Pro', category: 'Electronics', price: 89.99, demand_score: 94, ai_score: 91, stock: 234, trend: [40,55,45,60,58,72,65,80,75,90,85,94], badge: 'Trending' },
  { name: 'Yoga Mat Premium', category: 'Sports', price: 45.00, demand_score: 87, ai_score: 85, stock: 512, trend: [60,65,70,68,72,75,80,78,82,85,83,87], badge: 'Best-seller' },
  { name: 'Smart Water Bottle', category: 'Health', price: 34.99, demand_score: 76, ai_score: 82, stock: 189, trend: [30,35,40,45,50,55,58,62,65,70,74,76], badge: 'Opportunity' },
  { name: 'Resistance Bands Set', category: 'Sports', price: 28.99, demand_score: 82, ai_score: 79, stock: 678, trend: [50,55,60,58,65,68,72,75,78,80,81,82], badge: 'Best-seller' },
  { name: 'Bamboo Cutting Board', category: 'Kitchen', price: 22.50, demand_score: 65, ai_score: 68, stock: 345, trend: [40,42,45,44,48,50,52,55,58,60,63,65], badge: null },
  { name: 'LED Desk Lamp', category: 'Electronics', price: 55.99, demand_score: 71, ai_score: 74, stock: 156, trend: [45,48,52,50,55,58,62,65,68,70,71,71], badge: null },
  { name: 'Protein Shaker Bottle', category: 'Health', price: 18.99, demand_score: 88, ai_score: 86, stock: 891, trend: [55,60,65,68,72,75,80,82,85,86,88,88], badge: 'Best-seller' },
  { name: 'Foam Roller', category: 'Sports', price: 32.00, demand_score: 79, ai_score: 77, stock: 423, trend: [40,45,50,55,58,62,65,68,72,75,77,79], badge: null },
  { name: 'Stainless Steel Straws', category: 'Kitchen', price: 12.99, demand_score: 58, ai_score: 72, stock: 1200, trend: [35,38,42,45,48,50,52,54,56,57,58,58], badge: 'Opportunity' },
  { name: 'Posture Corrector', category: 'Health', price: 39.99, demand_score: 91, ai_score: 89, stock: 267, trend: [30,40,50,60,68,75,80,84,87,89,90,91], badge: 'Trending' },
  { name: 'Blue Light Glasses', category: 'Electronics', price: 29.99, demand_score: 85, ai_score: 88, stock: 543, trend: [50,55,62,65,70,75,78,80,82,84,85,85], badge: 'Trending' },
  { name: 'Silicone Baking Mat', category: 'Kitchen', price: 16.50, demand_score: 62, ai_score: 65, stock: 789, trend: [38,40,43,45,48,52,55,56,58,60,61,62], badge: null },
  { name: 'Jump Rope Speed', category: 'Sports', price: 24.99, demand_score: 73, ai_score: 76, stock: 334, trend: [42,46,50,54,58,62,64,66,68,70,72,73], badge: null },
  { name: 'Sleep Eye Mask', category: 'Health', price: 15.99, demand_score: 69, ai_score: 71, stock: 678, trend: [40,43,47,50,53,56,58,61,63,66,68,69], badge: null },
  { name: 'Portable Blender', category: 'Kitchen', price: 49.99, demand_score: 83, ai_score: 87, stock: 198, trend: [45,50,55,60,65,70,73,76,78,80,82,83], badge: 'Opportunity' },
  { name: 'Knee Compression Sleeve', category: 'Sports', price: 21.99, demand_score: 77, ai_score: 75, stock: 456, trend: [44,48,52,55,58,62,65,68,70,73,75,77], badge: null },
  { name: 'Aromatherapy Diffuser', category: 'Health', price: 42.00, demand_score: 80, ai_score: 83, stock: 312, trend: [48,52,55,58,62,66,69,72,74,77,79,80], badge: null },
  { name: 'Wireless Charging Pad', category: 'Electronics', price: 35.99, demand_score: 86, ai_score: 90, stock: 421, trend: [52,57,62,66,70,74,77,80,82,84,85,86], badge: 'Trending' },
  { name: 'Meal Prep Containers', category: 'Kitchen', price: 27.99, demand_score: 74, ai_score: 78, stock: 654, trend: [46,50,53,56,60,63,66,68,70,72,73,74], badge: 'Opportunity' },
  { name: 'Grip Strengthener', category: 'Sports', price: 14.99, demand_score: 67, ai_score: 70, stock: 567, trend: [38,41,44,47,50,53,56,58,61,63,65,67], badge: null },
];

const kpi = {
  total_revenue: 284750,
  revenue_change: 12.5,
  active_products: 1247,
  products_change: 8.3,
  avg_score: 82.4,
  score_change: 3.2,
  top_category: 'Electronics',
};

const revenue = [
  { month: 'Jan', revenue: 18500, target: 20000 },
  { month: 'Feb', revenue: 22300, target: 21000 },
  { month: 'Mar', revenue: 19800, target: 22000 },
  { month: 'Apr', revenue: 25600, target: 23000 },
  { month: 'May', revenue: 23100, target: 24000 },
  { month: 'Jun', revenue: 28400, target: 25000 },
  { month: 'Jul', revenue: 26700, target: 26000 },
  { month: 'Aug', revenue: 31200, target: 28000 },
  { month: 'Sep', revenue: 29800, target: 29000 },
  { month: 'Oct', revenue: 34500, target: 31000 },
  { month: 'Nov', revenue: 32100, target: 32000 },
  { month: 'Dec', revenue: 38750, target: 35000 },
];

const categories = [
  { name: 'Electronics', value: 35, color: '#6366f1' },
  { name: 'Sports',      value: 28, color: '#22d3ee' },
  { name: 'Health',      value: 22, color: '#a78bfa' },
  { name: 'Kitchen',     value: 15, color: '#34d399' },
];

const stores = [
  { name: 'Amazon',    revenue: 124500, products: 523, rating: 4.8, status: 'active' },
  { name: 'Shopify',   revenue: 89300,  products: 312, rating: 4.6, status: 'active' },
  { name: 'eBay',      revenue: 45200,  products: 198, rating: 4.2, status: 'active' },
  { name: 'Etsy',      revenue: 18750,  products: 156, rating: 4.9, status: 'active' },
  { name: 'Walmart',   revenue: 7000,   products: 58,  rating: 3.8, status: 'pending' },
];

const reports = [
  { title: 'Q4 2024 Performance Report',  date: '2024-12-31', type: 'Quarterly',  status: 'ready' },
  { title: 'Top Products Analysis',       date: '2025-01-15', type: 'Product',    status: 'ready' },
  { title: 'Market Trends January 2025',  date: '2025-01-31', type: 'Monthly',    status: 'processing' },
  { title: 'Competitor Pricing Analysis', date: '2025-02-01', type: 'Competitor', status: 'ready' },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await Promise.all([
    Product.deleteMany({}),
    KpiMetrics.deleteMany({}),
    RevenueData.deleteMany({}),
    Category.deleteMany({}),
    Store.deleteMany({}),
    Report.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  await Promise.all([
    Product.insertMany(products),
    KpiMetrics.create(kpi),
    RevenueData.insertMany(revenue),
    Category.insertMany(categories),
    Store.insertMany(stores),
    Report.insertMany(reports),
  ]);
  console.log('Seed complete');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
