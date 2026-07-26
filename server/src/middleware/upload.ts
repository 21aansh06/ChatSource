import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import { env } from "../config/env.js";

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
  },
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Invalid file format. Only PDF files are allowed."));
    }
  },
});

export const uploadSingleFile = upload.single("file");