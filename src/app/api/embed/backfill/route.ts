import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { embedImageUrl } from "@/lib/replicate";

/**
 * POST /api/embed/backfill
 * image_embedding = NULL bo'lgan barcha mahsulotlarni indekslaydi (joriy do'kon).
 * Ketma-ket ishlaydi (rate-limit'dan saqlanish). Natija: { indexed, failed, total }.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Avtorizatsiya kerak" }, { status: 401 });
    }

    // RLS: faqat o'z do'koni mahsulotlari, embedding'siz va faol
    const { data: products, error } = await supabase
      .from("products")
      .select("id, image_url")
      .is("image_embedding", null)
      .eq("is_active", true);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const total = products?.length ?? 0;
    let indexed = 0;
    let failed = 0;

    for (const product of products ?? []) {
      try {
        const embedding = await embedImageUrl(product.image_url);
        const { error: updErr } = await supabase
          .from("products")
          .update({ image_embedding: JSON.stringify(embedding) })
          .eq("id", product.id);
        if (updErr) {
          failed++;
        } else {
          indexed++;
        }
      } catch {
        failed++;
      }
    }

    return NextResponse.json({ indexed, failed, total });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Backfill xatosi";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
