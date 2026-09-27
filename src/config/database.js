import mongoose from 'mongoose';
import { mongoUri } from './env.js';

export async function connectDatabase() {
  await mongoose.connect(mongoUri);
  console.log('[Database] Connected to MongoDB successfully');
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
