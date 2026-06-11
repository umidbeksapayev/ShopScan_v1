"use client";

import { useRef } from "react";
import Image from "next/image";
import { Camera, ImagePlus, X, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { compressToWebp } from "@/lib/image";
import { cn } from "@/lib/utils";

export interface UploaderImage {
  blob: Blob;
  preview: string;
}

interface MultiImageUploaderProps {
  /** Yangi tanlangan rasmlar (1-max) */
  value: UploaderImage[];
  /** Tahrirlashda mavjud rasm URL (faqat ko'rsatish, yangi rasm tanlanmaguncha) */
  existingUrl?: string | null;
  max?: number;
  onChange: (images: UploaderImage[]) => void;
}

/**
 * Bir nechta rasm yuklash (multi-image). Birinchisi — ASOSIY (katalogda ko'rinadi).
 * Har bir rasm CLIP bilan indekslanadi → tanish aniqligi oshadi.
 */
export function MultiImageUploader({
  value,
  existingUrl,
  max = 3,
  onChange,
}: MultiImageUploaderProps) {
  const { t } = useTranslation();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const room = max - value.length;
    if (room <= 0) {
      toast.error(t("uploader.max", { max }));
      return;
    }

    const picked = files.slice(0, room);
    try {
      const next: UploaderImage[] = [];
      for (const file of picked) {
        if (!file.type.startsWith("image/")) continue;
        const blob = await compressToWebp(file);
        next.push({ blob, preview: URL.createObjectURL(blob) });
      }
      onChange([...value, ...next]);
    } catch {
      toast.error(t("uploader.processError"));
    }
  }

  function removeAt(idx: number) {
    const img = value[idx];
    if (img) URL.revokeObjectURL(img.preview);
    onChange(value.filter((_, i) => i !== idx));
  }

  const showExisting = value.length === 0 && existingUrl;
  const canAdd = value.length < max;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {/* Tahrirlashda mavjud rasm (yangi tanlanmaguncha) */}
        {showExisting && (
          <div className="relative col-span-1 aspect-square overflow-hidden rounded-lg border bg-muted">
            <Image
              src={existingUrl}
              alt={t("uploader.existing")}
              fill
              sizes="120px"
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        {/* Yangi tanlangan rasmlar */}
        {value.map((img, idx) => (
          <div
            key={img.preview}
            className="relative aspect-square overflow-hidden rounded-lg border bg-muted"
          >
            <Image
              src={img.preview}
              alt={`${t("uploader.image")} ${idx + 1}`}
              fill
              sizes="120px"
              className="object-cover"
              unoptimized
            />
            {idx === 0 && (
              <span className="absolute left-1 top-1 flex items-center gap-0.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                <Star className="h-2.5 w-2.5" /> {t("uploader.primary")}
              </span>
            )}
            <button
              type="button"
              onClick={() => removeAt(idx)}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
              aria-label={t("uploader.remove")}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {/* Qo'shish slot */}
        {canAdd && (
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className={cn(
              "flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-input text-muted-foreground hover:bg-accent"
            )}
          >
            <ImagePlus className="h-6 w-6" />
            <span className="text-[11px]">{t("uploader.add")}</span>
          </button>
        )}
      </div>

      {canAdd && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-md border border-input bg-background py-2 text-sm font-medium hover:bg-accent"
          >
            <Camera className="h-4 w-4" /> {t("uploader.camera")}
          </button>
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-md border border-input bg-background py-2 text-sm font-medium hover:bg-accent"
          >
            <ImagePlus className="h-4 w-4" /> {t("uploader.gallery")}
          </button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">{t("uploader.hint", { max })}</p>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFiles}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
    </div>
  );
}
