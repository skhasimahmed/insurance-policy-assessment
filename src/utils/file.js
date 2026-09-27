import path from 'node:path';
import AppError from './app-error.js';

const allowedExtensions = new Set(['.csv', '.xlsx', '.xls']);

export function validateFileExtension(filename) {
  const extension = path.extname(filename).toLowerCase();
  if (!allowedExtensions.has(extension)) {
    throw new AppError('Invalid file format. Only .csv, .xlsx, and .xls files are supported.', 400);
  }
  return extension;
}
