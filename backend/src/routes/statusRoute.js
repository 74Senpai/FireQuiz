import { Router } from 'express';
import cors from 'cors';
import pool from '../db/db.js';

const router = Router();

// Allow requests from any origin (e.g. GitHub Actions uptime pinger)
router.use(cors({ origin: '*' }));

/**
 * GET /api/status
 * Public health-check endpoint — no authentication required.
 * Accessible from any origin (no CORS restriction).
 * Returns server uptime and a quick database ping result.
 */
router.get('/', async (req, res) => {
  const start = Date.now();

  let dbStatus = 'ok';
  let dbLatencyMs = null;

  try {
    const dbStart = Date.now();
    await pool.query('SELECT 1');
    dbLatencyMs = Date.now() - dbStart;
  } catch (err) {
    dbStatus = 'error';
  }

  return res.status(dbStatus === 'ok' ? 200 : 503).json({
    status: dbStatus === 'ok' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),          // seconds since process started
    responseTimeMs: Date.now() - start,
    services: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
    },
  });
});

export default router;
