import { z } from "zod";

export const UploadFileSchema = z.object({
  buffer: z.instanceof(Buffer),
  mimeType: z.string().min(1),
  originalName: z.string().min(1),
  size: z.number().int().positive(),
});

export type UploadFile = z.infer<typeof UploadFileSchema>;