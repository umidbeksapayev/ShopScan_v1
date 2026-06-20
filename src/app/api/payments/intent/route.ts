import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAcquiringProvider } from "@/lib/acquiring";
import type { AcquiringProviderType } from "@/types/database";

// QR to'lov urinishini yaratadi (authed — RLS a'zolikni tekshiradi) va checkout
// havolasini qaytaradi. Maxfiy kalit BU YERDA kerak emas — faqat merchant_id.
export const runtime = "nodejs";

interface CartItem {
  product_id: string;
  quantity: number;
}
interface Body {
  shopId?: string;
  items?: CartItem[];
  amount?: number;
  searchMethod?: string;
  clientId?: string;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const { shopId, items, amount, searchMethod = "manual", clientId } = body;
  if (
    !shopId ||
    !clientId ||
    !Array.isArray(items) ||
    items.length === 0 ||
    typeof amount !== "number" ||
    !(amount > 0)
  ) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  // Do'kon ekvayring sozlamasi (RLS: a'zo o'qiy oladi)
  const { data: shop } = await supabase
    .from("shops")
    .select("acquiring_enabled, acquiring_provider, acquiring_merchant_id")
    .eq("id", shopId)
    .single();

  if (!shop?.acquiring_enabled || !shop.acquiring_provider || !shop.acquiring_merchant_id) {
    return NextResponse.json({ error: "acquiring_not_configured" }, { status: 400 });
  }

  const provider = getAcquiringProvider(
    shop.acquiring_provider as AcquiringProviderType
  );
  if (!provider) {
    return NextResponse.json({ error: "provider_not_supported" }, { status: 400 });
  }

  // Intent yozish (idempotent: shop_id + client_id UNIQUE)
  const insert = await supabase
    .from("payment_intents")
    .insert({
      shop_id: shopId,
      provider: shop.acquiring_provider,
      amount,
      cart_snapshot: items,
      search_method: searchMethod,
      client_id: clientId,
    })
    .select("id")
    .single();

  let intentId = insert.data?.id as string | undefined;

  if (insert.error) {
    // Takroriy client_id — mavjud intentni qaytaramiz (idempotentlik)
    if (insert.error.code === "23505") {
      const { data: existing } = await supabase
        .from("payment_intents")
        .select("id")
        .eq("shop_id", shopId)
        .eq("client_id", clientId)
        .single();
      intentId = existing?.id as string | undefined;
    }
    if (!intentId) {
      return NextResponse.json({ error: insert.error.message }, { status: 400 });
    }
  }

  if (!intentId) {
    return NextResponse.json({ error: "intent_create_failed" }, { status: 500 });
  }

  const payUrl = provider.buildCheckoutUrl({
    intentId,
    amount,
    merchantId: shop.acquiring_merchant_id,
    returnUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
  });

  return NextResponse.json({
    intentId,
    payUrl,
    provider: shop.acquiring_provider,
  });
}
