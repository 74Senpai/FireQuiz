import express from 'express';
import * as mediaController from '../controllers/mediaController.js';

import { getIdFromToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/v1/media/view
 * @desc    Redirect to a signed Supabase URL for private media
 * @access  Public (since anyone with the QR/Link should be able to view)
 */
router.get('/view', getIdFromToken, mediaController.handleMediaRedirect);

export default router;
