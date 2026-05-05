import { Router } from 'express';
import Store from '../models/Store.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const stores = await Store.find().sort({ revenue: -1 });
    res.json(stores);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
