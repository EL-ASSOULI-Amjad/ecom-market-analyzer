import { Router } from 'express';
import Category from '../models/Category.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
