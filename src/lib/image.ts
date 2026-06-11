"use client";

const MAX_DIM = 1024;

/**
 * Rasmni client'da WebP (max o'lcham) ga siqadi.
 * @param file - File yoki Blob
 * @param maxDim - maksimal tomon (px), default 1024
 */
export async function compressToWebp(
  file: File | Blob,
  maxDim = MAX_DIM
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;

  if (width > maxDim || height > maxDim) {
    const scale = maxDim / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas kontekst topilmadi");
  ctx.drawImage(bitmap, 0, 0, width, height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Siqishda xato"))),
      "image/webp",
      0.85
    );
  });
}
