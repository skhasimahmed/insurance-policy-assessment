import fs from 'node:fs';
import path from 'node:path';
import { Worker } from 'node:worker_threads';
import mongoose from 'mongoose';
import repository from '../repositories/import.repository.js';
import AppError from '../utils/app-error.js';

export async function startImport(file) {
  if (!file) {
    throw new AppError('Please provide a file to import (.csv, .xlsx, or .xls).', 400);
  }

  const job = await repository.create({
    status: 'queued',
    fileName: file.originalname,
  });

  const workerPath = new URL('../workers/import.worker.js', import.meta.url);
  const resolvedPath = path.resolve(file.path);

  console.log(
    `[Import] Dispatched background worker for "${file.originalname}" (Job ID: ${job._id})`
  );

  const worker = new Worker(workerPath, {
    workerData: {
      filePath: resolvedPath,
      jobId: job._id.toString(),
    },
  });

  const cleanupFile = () => {
    if (fs.existsSync(resolvedPath)) {
      try {
        fs.unlinkSync(resolvedPath);
      } catch (error) {
        console.warn('[Import] Could not remove uploaded file:', error.message);
      }
    }
  };

  worker.on('error', async (error) => {
    cleanupFile();
    console.error(
      `[Import] Background worker encountered an error for Job ${job._id}:`,
      error.message || error
    );
    await repository.update(job._id, {
      status: 'failed',
      error: error.message,
    });
  });

  worker.on('exit', async (code) => {
    cleanupFile();
    if (code !== 0) {
      console.warn(
        `[Import] Background worker for Job ${job._id} exited with non-zero code ${code}`
      );
      const current = await repository.findById(job._id);

      if (current?.status !== 'failed') {
        await repository.update(job._id, {
          status: 'failed',
          error: `Worker process stopped with exit code ${code}`,
        });
      }
    }
  });

  return job;
}

export async function getImportStatus(jobId) {
  if (!mongoose.isValidObjectId(jobId)) {
    throw new AppError('Invalid job ID format. Please provide a valid 24-character ID.', 400);
  }

  const job = await repository.findById(jobId);

  if (!job) {
    throw new AppError(`No import job found with ID "${jobId}".`, 404);
  }

  return job;
}
