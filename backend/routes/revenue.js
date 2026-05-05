import { Router } from 'express';
import RevenueData from '../models/RevenueData.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const data = await RevenueData.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
