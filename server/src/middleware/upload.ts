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
    const isPdf = file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf");
    const isMd =
      file.mimetype === "text/markdown" ||
      file.mimetype === "text/plain" ||
      file.mimetype === "text/x-markdown" ||
      file.originalname.toLowerCase().endsWith(".md") ||
      file.originalname.toLowerCase().endsWith(".markdown");

    if (isPdf || isMd) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file format. Only PDF (.pdf) and Markdown (.md, .markdown) files are allowed."));
    }
  },
});

export const uploadSingleFile = upload.single("file");