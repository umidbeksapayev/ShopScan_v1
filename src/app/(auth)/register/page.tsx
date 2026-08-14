"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { authErrorKey } from "@/lib/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Email tasdiqlash yoqilgach signUp sessiya qaytarmaydi — avval bu holatda
  // parol bilan avtomatik kirishga harakat qilinardi (har doim muvaffaqiyatsiz
  // tugardi, chunki email hali tasdiqlanmagan). Endi shu holatni "pochtangizni
  // tekshiring" ekrani bilan to'g'ri ko'rsatamiz (mobil verify-email.tsx bilan
  // bir xil oqim — ikkalasi ham bitta Supabase loyihasi sozlamasiga bog'liq).
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 6) {
      toast.error(t("auth.passwordTooShort"));
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // Do'kon nomi metadata orqali uzatiladi — DB trigger shops yozuvini yaratadi
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { shop_name: shopName.trim() } },
    });

    setLoading(false);

    if (error) {
      toast.error(t("auth.registerFailed"), {
        description: t(authErrorKey(error.message)),
      });
      return;
    }

    // Supabase "email enumeration protection" mavjud email uchun xato emas,
    // soxta muvaffaqiyat qaytaradi va xat yubormaydi. Yagona belgi —
    // `identities` bo'sh massiv (mobil register.tsx da ham shu tekshiruv).
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      toast.error(t("auth.registerFailed"), {
        description: t("auth.errAlreadyRegistered"),
      });
      return;
    }

    if (data.session) {
      // "Confirm email" o'chirilgan (masalan lokal sinovda) — sessiya
      // darhol keldi, middleware dashboard'ga yo'naltiradi.
      toast.success(t("auth.welcome"));
      window.location.href = "/dashboard";
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-background via-accent/40 to-background p-4">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 text-center shadow-card">
          <h1 className="flex justify-center text-foreground">
            <Logo className="h-11 w-auto" />
          </h1>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="text-lg font-medium text-foreground">{t("auth.verifyTitle")}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("auth.verifySubtitle", { email })}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">{t("auth.verifyHint")}</p>
          <Link href="/login" className="inline-block text-sm font-medium text-primary hover:underline">
            {t("auth.backToLogin")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-background via-accent/40 to-background p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-card p-8 shadow-card">
        <div className="text-center">
          <h1 className="flex justify-center text-foreground">
            <Logo className="h-11 w-auto" />
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">{t("auth.registerSubtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shopName">{t("auth.shopName")}</Label>
            <Input
              id="shopName"
              type="text"
              required
              placeholder={t("auth.shopNamePlaceholder")}
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="email@misol.uz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              placeholder={t("auth.passwordHint")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("auth.registering") : t("auth.registerBtn")}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {t("auth.haveAccount")}{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            {t("auth.goLogin")}
          </Link>
        </p>
      </div>
    </div>
  );
}
