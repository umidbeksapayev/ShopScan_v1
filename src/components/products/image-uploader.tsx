"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  value: Blob | null;
  previewUrl: string | null; // tahrirlashda mavjud rasm URL
  onChange: (blob: Blob | null) => void;
}

const MAX_DIM = 1024;

/**
 * Rasmni kameradan yoki galereyadan oladi, client'da WebP (max 1024px) ga siqadi.
 */
async function compressToWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;

  if (width > MAX_DIM || height > MAX_DIM) {
    const scale = MAX_DIM / Math.max(width, height);
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

export function ImageUploader({ value, previewUrl, onChange }: ImageUploaderProps) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // bir xil faylni qayta tanlash mumkin bo'lsin
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Faqat rasm fayllari qabul qilinadi");
      return;
    }

    try {
      const blob = await compressToWebp(file);
      setLocalPreview(URL.createObjectURL(blob));
      onChange(blob);
    } catch {
      toast.error("Rasmni qayta ishlashda xato");
    }
  }

  function clear() {
    setLocalPreview(null);
    onChange(null);
  }

  const shown = localPreview ?? (value ? null : previewUrl);

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "relative aspect-square w-full overflow-hidden rounded-lg border-2 border-dashed",
          shown ? "border-transparent" : "border-gray-300 bg-muted"
        )}
      >
        {shown ? (
          <>
            <Image
              src={shown}
              alt="Mahsulot rasmi"
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              className="object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={clear}
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
              aria-label="Rasmni o'chirish"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-muted-foreground">
            <ImagePlus className="h-10 w-10" />
            <span className="text-sm">Rasm tanlang</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          className="flex items-center justify-center gap-2 rounded-md border border-input bg-background py-2 text-sm font-medium hover:bg-accent"
        >
          <Camera className="h-4 w-4" /> Kamera
        </button>
        <button
          type="button"
          onClick={() => galleryRef.current?.click()}
          className="flex items-center justify-center gap-2 rounded-md border border-input bg-background py-2 text-sm font-medium hover:bg-accent"
        >
          <ImagePlus className="h-4 w-4" /> Galereya
        </button>
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
