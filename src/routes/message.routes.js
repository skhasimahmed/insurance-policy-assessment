import express from 'express';
import { schedule, list } from '../controllers/message.controller.js';
import asyncHandler from '../utils/async-handler.js';

const router = express.Router();
router.post('/', asyncHandler(schedule));
router.get('/', asyncHandler(list));

export default router;
