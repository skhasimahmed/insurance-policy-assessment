import express from 'express';
import { search, summary } from '../controllers/policy.controller.js';
import asyncHandler from '../utils/async-handler.js';

const router = express.Router();
router.get('/search', asyncHandler(search));
router.get('/summary', asyncHandler(summary));

export default router;
