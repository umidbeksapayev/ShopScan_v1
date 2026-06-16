"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ScanLine } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { authErrorKey } from "@/lib/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

    if (error) {
      toast.error(t("auth.registerFailed"), {
        description: t(authErrorKey(error.message)),
      });
      setLoading(false);
      return;
    }

    // Email tasdiqlash yoqilgan bo'lsa sessiya bo'lmaydi
    // Auto-kirish: "Confirm email" o'chirilgan bo'lsa signUp sessiyani darhol qaytaradi.
    // Aks holda login/parol bilan darhol kirishga harakat qilamiz (email yuborilmaydi).
    if (!data.session) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInErr) {
        toast.error(t("auth.autoSignInFailed"), {
          description: t("auth.autoSignInFailedDesc"),
        });
        setLoading(false);
        router.push("/login");
        return;
      }
    }

    toast.success(t("auth.welcome"));
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-background via-accent/40 to-background p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-card p-8 shadow-card">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-primary-foreground shadow-pop">
            <ScanLine className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-brand-gradient">ShopScan</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("auth.registerSubtitle")}</p>
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
