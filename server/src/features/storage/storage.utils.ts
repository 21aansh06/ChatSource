import { randomUUID } from 'crypto';

/**
 * Helper function to generate standardized storage path keys for files.
 * Format: users/<userId>/file/<fileId>/sources/<randomUUID>.<ext>
 */
export function generateStorageKey(
  userId: string,
  fileId: string,
  extension: string = 'pdf'
): string {
  const uuid = randomUUID();
  const cleanExt = extension.replace(/^\./, '');
  return `users/${userId}/file/${fileId}/sources/${uuid}.${cleanExt}`;
}
