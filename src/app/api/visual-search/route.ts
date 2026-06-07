import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { embedImageData } from "@/lib/replicate";

/**
 * POST /api/visual-search  { image: "data:image/...;base64,..." }
 * Kameradan olingan rasmni CLIP bilan embed qilib, do'kondagi eng o'xshash
 * mahsulotlarni (top-3) qaytaradi. match_products RPC + pgvector HNSW.
 */
export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "Rasm kerak" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Avtorizatsiya kerak" }, { status: 401 });
    }

    // Foydalanuvchining do'koni (RLS — faqat o'ziniki)
    const { data: shop, error: shopErr } = await supabase
      .from("shops")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (shopErr || !shop) {
      return NextResponse.json({ error: "Do'kon topilmadi" }, { status: 404 });
    }

    const embedding = await embedImageData(image);

    const { data: matches, error: matchErr } = await supabase.rpc("match_products", {
      p_shop_id: shop.id,
      p_embedding: JSON.stringify(embedding),
      p_match_count: 3,
      p_threshold: 0.0,
    });

    if (matchErr) {
      return NextResponse.json({ error: matchErr.message }, { status: 500 });
    }

    return NextResponse.json({ products: matches ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Qidiruv xatosi";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
