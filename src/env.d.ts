declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    /** Server-only: Telegram webhook + cron uchun (RLS chetlab). */
    SUPABASE_SERVICE_ROLE_KEY?: string;
    NEXT_PUBLIC_APP_URL?: string;
    /** Markaziy uscan Telegram boti tokeni (@BotFather). Server-only. */
    TELEGRAM_BOT_TOKEN?: string;
    /** Telegram webhook'ni himoyalovchi sirli token (setWebhook'da beriladi). */
    TELEGRAM_WEBHOOK_SECRET?: string;
  }
}
