import { Router } from 'express';
import KpiMetrics from '../models/KpiMetrics.js';

const router = Router();

// Returns the most recently updated KPI document
router.get('/', async (_req, res) => {
  try {
    const kpi = await KpiMetrics.findOne().sort({ updatedAt: -1 });
    if (!kpi) return res.status(404).json({ message: 'No KPI data found' });
    res.json(kpi);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const kpi = await KpiMetrics.findOneAndUpdate({}, req.body, {
      new: true,
      upsert: true,
      runValidators: true,
    });
    res.json(kpi);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
