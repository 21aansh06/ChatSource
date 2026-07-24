import { z } from "zod";

export const UploadFileSchema = z.object({
  buffer: z.instanceof(Buffer),
  mimeType: z.string().min(1),
  originalName: z.string().min(1),
  size: z.number().int().positive(),
});

export type UploadFile = z.infer<typeof UploadFileSchema>;

export function parseMulterFile(file: Express.Multer.File): UploadFile {
  return UploadFileSchema.parse({
    buffer: file.buffer,
    mimeType: file.mimetype,
    originalName: file.originalname,
    size: file.size,
  });
}