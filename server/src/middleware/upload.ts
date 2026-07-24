import multer from 'multer';
import { env } from '../config/env.js';

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only PDF files are allowed.'));
    }
  },
});

export const uploadSingleFile = upload.single('file');
