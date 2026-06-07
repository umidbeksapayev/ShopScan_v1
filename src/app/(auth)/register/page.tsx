"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ScanLine } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
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
      toast.error("Ro'yxatdan o'tish amalga oshmadi", {
        description: error.message,
      });
      setLoading(false);
      return;
    }

    // Email tasdiqlash yoqilgan bo'lsa sessiya bo'lmaydi
    if (data.session) {
      toast.success("Hisob yaratildi!");
      router.push("/dashboard");
      router.refresh();
    } else {
      toast.success("Hisob yaratildi!", {
        description: "Emailingizni tasdiqlang, so'ng tizimga kiring.",
      });
      router.push("/login");
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-card p-8 shadow-card">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-pop">
            <ScanLine className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">ShopScan</h1>
          <p className="mt-1 text-sm text-muted-foreground">Yangi do&apos;kon hisobini yarating</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shopName">Do&apos;kon nomi</Label>
            <Input
              id="shopName"
              type="text"
              required
              placeholder="Mening do'konim"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
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
            <Label htmlFor="password">Parol</Label>
            <Input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Kamida 6 ta belgi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Yaratilmoqda..." : "Ro'yxatdan o'tish"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Hisobingiz bormi?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Kirish
          </Link>
        </p>
      </div>
    </div>
  );
}
