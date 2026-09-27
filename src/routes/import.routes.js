import express from 'express';
import { status, upload } from '../controllers/import.controller.js';
import uploadMiddleware from '../middleware/upload.middleware.js';
import asyncHandler from '../utils/async-handler.js';

const router = express.Router();
router.post('/', uploadMiddleware.single('file'), asyncHandler(upload));
router.get('/:jobId', asyncHandler(status));

export default router;
