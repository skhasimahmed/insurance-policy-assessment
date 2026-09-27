import dotenv from 'dotenv';

dotenv.config();

export const nodeEnv = process.env.NODE_ENV || 'development';
export const port = Number(process.env.PORT) || 5000;
export const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/insurance_assessment';
export const cpuThreshold = Number(process.env.CPU_THRESHOLD) || 70;
export const cpuCheckInterval = Number(process.env.CPU_CHECK_INTERVAL) || 5000;
export const uploadDir = process.env.UPLOAD_DIR || 'uploads';
