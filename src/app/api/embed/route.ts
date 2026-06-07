import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { embedImageUrl } from "@/lib/replicate";

/**
 * POST /api/embed  { productId }
 * Mahsulot rasmini CLIP bilan embed qilib image_embedding ustunini yangilaydi.
 * Authed: RLS faqat foydalanuvchining mahsulotiga ruxsat beradi.
 */
export async function POST(req: Request) {
  try {
    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ error: "productId kerak" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Avtorizatsiya kerak" }, { status: 401 });
    }

    // RLS: faqat o'z mahsuloti
    const { data: product, error: fetchErr } = await supabase
      .from("products")
      .select("id, image_url")
      .eq("id", productId)
      .single();

    if (fetchErr || !product) {
      return NextResponse.json({ error: "Mahsulot topilmadi" }, { status: 404 });
    }

    const embedding = await embedImageUrl(product.image_url);

    // pgvector ustuni matn formatida qabul qiladi: "[0.1,0.2,...]"
    const { error: updErr } = await supabase
      .from("products")
      .update({ image_embedding: JSON.stringify(embedding) })
      .eq("id", productId);

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Embed xatosi";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
