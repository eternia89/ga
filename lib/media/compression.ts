'use client';

import imageCompression from 'browser-image-compression';

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.8,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/webp' as const,
  initialQuality: 0.85,
  preserveExif: false,
};

/**
 * Compresses an image file to WebP format with a max size of 800KB.
 * Runs client-side via browser-image-compression.
 */
export async function compressImage(file: File): Promise<File> {
  const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
  return compressed;
}
