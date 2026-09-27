import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { uploadDir } from '../config/env.js';
import AppError from '../utils/app-error.js';

const absoluteDir = path.resolve(uploadDir);
fs.mkdirSync(absoluteDir, { recursive: true });

const storage = multer.diskStorage({
  destination: absoluteDir,
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const allowed = new Set(['.csv', '.xlsx', '.xls']);

    if (!allowed.has(extension)) {
      return cb(
        new AppError('Invalid file format. Only .csv, .xlsx, and .xls files are supported.', 400)
      );
    }

    cb(null, true);
  },
});

export default upload;
