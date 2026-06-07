import Replicate from "replicate";

/**
 * CLIP ViT-B/32 embeddings (512-d) Replicate orqali.
 * FAQAT server-side — REPLICATE_API_TOKEN hech qachon brauzerga chiqmaydi.
 */

// krthr/clip-embeddings: image yoki text → 512-d ViT-B/32 vektor
const CLIP_MODEL =
  "krthr/clip-embeddings:1c0371070cb827ec3c7f2f28adcdde54b50dcd239aa6faea0bc98b174ef03fb4";

let client: Replicate | null = null;

function getClient(): Replicate {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token || token.startsWith("r8_xxxx")) {
    throw new Error(
      "REPLICATE_API_TOKEN sozlanmagan. .env.local ga haqiqiy token qo'shing."
    );
  }
  if (!client) {
    client = new Replicate({ auth: token });
  }
  return client;
}

/**
 * Rasm URL'idan 512-o'lchovli CLIP embedding oladi.
 * @param imageUrl - public rasm URL (Supabase Storage)
 */
export async function embedImageUrl(imageUrl: string): Promise<number[]> {
  const replicate = getClient();
  const output = (await replicate.run(CLIP_MODEL, {
    input: { image: imageUrl },
  })) as { embedding?: number[] } | number[];

  const embedding = Array.isArray(output) ? output : output?.embedding;
  if (!embedding || embedding.length !== 512) {
    throw new Error(
      `CLIP noto'g'ri natija qaytardi (kutilgan 512, olingan ${
        embedding?.length ?? "yo'q"
      }).`
    );
  }
  return embedding;
}

/**
 * base64 data URI rasmdan 512-d CLIP embedding oladi (vizual qidiruv uchun).
 * @param dataUri - "data:image/...;base64,..." formatida
 */
export async function embedImageData(dataUri: string): Promise<number[]> {
  const replicate = getClient();
  const output = (await replicate.run(CLIP_MODEL, {
    input: { image: dataUri },
  })) as { embedding?: number[] } | number[];

  const embedding = Array.isArray(output) ? output : output?.embedding;
  if (!embedding || embedding.length !== 512) {
    throw new Error(
      `CLIP noto'g'ri natija qaytardi (kutilgan 512, olingan ${
        embedding?.length ?? "yo'q"
      }).`
    );
  }
  return embedding;
}

/** Token mavjud va haqiqiyligini tekshiradi (build/health uchun). */
export function isReplicateConfigured(): boolean {
  const token = process.env.REPLICATE_API_TOKEN;
  return !!token && !token.startsWith("r8_xxxx");
}
