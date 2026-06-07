"use client";

/**
 * Brauzerda CLIP ViT-B/32 (Transformers.js) — 512-o'lchovli embedding.
 * Replicate o'rniga: API yo'q, token yo'q, to'lov yo'q.
 * Model birinchi marta HF CDN'dan yuklanadi (~25MB quantized) va brauzerda keshlanadi.
 */

// Transformers.js tiplari dinamik import bo'lgani uchun any ishlatamiz
/* eslint-disable @typescript-eslint/no-explicit-any */
type Processor = any;
type VisionModel = any;

const MODEL_ID = "Xenova/clip-vit-base-patch32";

let loadPromise: Promise<{ processor: Processor; model: VisionModel }> | null = null;

/** CLIP modelini bir marta yuklaydi (lazy, keshlanadi). */
async function getModel() {
  if (!loadPromise) {
    loadPromise = (async () => {
      const { AutoProcessor, CLIPVisionModelWithProjection, env } = await import(
        "@xenova/transformers"
      );
      // Faqat masofaviy (HF CDN) modellardan foydalanamiz
      env.allowLocalModels = false;
      const processor = await AutoProcessor.from_pretrained(MODEL_ID);
      const model = await CLIPVisionModelWithProjection.from_pretrained(MODEL_ID, {
        quantized: true,
      });
      return { processor, model };
    })();
  }
  return loadPromise;
}

/**
 * Rasmni 512-o'lchovli normalizatsiyalangan CLIP embeddingga aylantiradi.
 * @param source - Blob (kamera/yuklash) yoki URL/dataURI (string)
 */
export async function embedImage(source: Blob | string): Promise<number[]> {
  const { processor, model } = await getModel();
  const { RawImage } = await import("@xenova/transformers");

  const image =
    typeof source === "string"
      ? await RawImage.read(source)
      : await RawImage.fromBlob(source);

  const inputs = await processor(image);
  const { image_embeds } = await model(inputs);

  const data = Array.from(image_embeds.data as Float32Array) as number[];
  // L2 normalizatsiya (kosinus o'xshashlik uchun)
  const norm = Math.sqrt(data.reduce((s, v) => s + v * v, 0)) || 1;
  return data.map((v) => v / norm);
}

/** Modelni oldindan yuklash (ixtiyoriy — birinchi qidiruvni tezlatadi). */
export function preloadClip(): void {
  void getModel().catch(() => {
    /* yuklash xatosi qidiruvni to'smaydi */
  });
}
