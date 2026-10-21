/**
 * Small helpers shared by the two image fields.
 *
 * Both are client-only: `readImageSize` decodes a file the author just picked, and `formatFileSize`
 * formats its size for a refusal message. They live here rather than in either field because the
 * product form and the homepage form ask the same two questions, and a second copy is a second place
 * for the answer to drift.
 */

/** Rounded, and never "0 KB", because the point is to tell the user how far over they are. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * The pixel size of a file the author just chose, read locally so they can judge it before saving.
 *
 * Only ever called for a freshly picked file. An already-uploaded image is displayed through
 * `next/image`, which serves a resized copy, so its `naturalWidth` would report the thumbnail rather
 * than the original.
 *
 * Resolves to null instead of throwing: a file the browser cannot decode is already refused by the
 * server's signature check, and a missing readout must not break the upload.
 */
export function readImageSize(
  file: File,
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();

    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(objectUrl);
    };
    image.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(objectUrl);
    };

    image.src = objectUrl;
  });
}
