import express from 'express';
import healthRoutes from './health.routes.js';
import importRoutes from './import.routes.js';
import policyRoutes from './policy.routes.js';
import messageRoutes from './message.routes.js';

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/import', importRoutes);
router.use('/policies', policyRoutes);
router.use('/messages', messageRoutes);

export default router;
