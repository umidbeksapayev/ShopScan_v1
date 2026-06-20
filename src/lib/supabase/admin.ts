import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — RLS'ni chetlab o'tadi. FAQAT server tomon
 * (Telegram webhook, cron) uchun. Foydalanuvchi sessiyasi yo'q joylarda ishlatiladi.
 *
 * ⚠️ SUPABASE_SERVICE_ROLE_KEY hech qachon clientga chiqmasligi kerak.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY sozlanmagan (.env.local)");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
