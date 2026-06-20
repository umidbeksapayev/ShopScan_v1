import { createClient } from "@/lib/supabase/client";
import type { AcquiringProviderType } from "@/types/database";

/**
 * Ekvayring (QR to'lov) sozlamasini saqlash — egasi uchun.
 *
 * Maxfiy kalit `payment_credentials`ga upsert qilinadi (RLS: ega yoza oladi,
 * lekin O'QIY OLMAYDI). Ochiq sozlamalar (yoqilgan/provayder/merchant_id)
 * `shops`da. acquiring_has_credentials RPC kalit borligini SELECT'siz tekshiradi.
 */

/** Maxfiy kalit o'rnatilganmi (SELECT'siz tekshiruv). */
export async function acquiringHasCredentials(shopId: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase.rpc("acquiring_has_credentials", {
    p_shop_id: shopId,
  });
  return data === true;
}

export interface SaveAcquiringArgs {
  shopId: string;
  enabled: boolean;
  provider: AcquiringProviderType;
  merchantId: string;
  /** Bo'sh bo'lsa — mavjud kalitga TEGMAYMIZ (qayta kiritish shart emas). */
  secretKey?: string;
}

export async function saveAcquiringConfig(args: SaveAcquiringArgs): Promise<void> {
  const supabase = createClient();

  const { error: shopErr } = await supabase
    .from("shops")
    .update({
      acquiring_enabled: args.enabled,
      acquiring_provider: args.provider,
      acquiring_merchant_id: args.merchantId.trim() || null,
    })
    .eq("id", args.shopId);
  if (shopErr) throw shopErr;

  const secret = args.secretKey?.trim();
  if (secret) {
    const { error: credErr } = await supabase.from("payment_credentials").upsert(
      {
        shop_id: args.shopId,
        provider: args.provider,
        secret_key: secret,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "shop_id" }
    );
    if (credErr) throw credErr;
  }
}

/** Do'kon uchun Payme Merchant API webhook URL'i (kabinetga yoziladi). */
export function paymeWebhookUrl(shopId: string): string {
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${origin}/api/payments/payme/${shopId}`;
}
