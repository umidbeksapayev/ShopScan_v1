"use client";

import { useEffect, useState } from "react";
import { Store, User, FileSpreadsheet, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { authErrorKey } from "@/lib/auth-errors";
import { useShop } from "@/hooks/use-shop";
import { useOwnerGuard } from "@/hooks/use-guards";
import { listProducts } from "@/lib/products";
import { exportProductsXlsx } from "@/lib/excel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SettingsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: shop } = useShop();

  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingShop, setSavingShop] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { checking } = useOwnerGuard();

  useEffect(() => {
    if (shop) setShopName(shop.name);
  }, [shop]);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  async function saveShopName() {
    if (!shop || !shopName.trim()) return;
    setSavingShop(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("shops")
        .update({ name: shopName.trim() })
        .eq("id", shop.id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["shop"] });
      toast.success(t("settings.shopNameSaved"));
    } catch (err) {
      toast.error(t("settings.saveError"), {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSavingShop(false);
    }
  }

  async function saveEmail() {
    if (!email.trim()) return;
    setSavingEmail(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ email: email.trim() });
      if (error) throw error;
      toast.success(t("settings.emailSaved"), {
        description: t("settings.emailConfirmNote"),
      });
    } catch (err) {
      toast.error(t("settings.saveError"), {
        description: t(authErrorKey(err instanceof Error ? err.message : "")),
      });
    } finally {
      setSavingEmail(false);
    }
  }

  async function savePassword() {
    if (newPassword.length < 6) {
      toast.error(t("auth.passwordTooShort"));
      return;
    }
    setSavingPw(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword("");
      toast.success(t("settings.passwordSaved"));
    } catch (err) {
      toast.error(t("settings.saveError"), {
        description: t(authErrorKey(err instanceof Error ? err.message : "")),
      });
    } finally {
      setSavingPw(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const products = await listProducts({});
      if (products.length === 0) {
        toast.error(t("settings.exportEmpty"));
        return;
      }
      await exportProductsXlsx(products, shop?.name ?? "shopscan");
      toast.success(t("settings.exportDone"));
    } catch (err) {
      toast.error(t("settings.exportError"), {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setExporting(false);
    }
  }

  if (checking) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t("settings.title")}</h1>

      {/* Do'kon ma'lumotlari */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            {t("settings.profileSection")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="shopName">{t("settings.shopNameLabel")}</Label>
            <Input
              id="shopName"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
            />
          </div>
          <Button onClick={saveShopName} disabled={savingShop || !shopName.trim()}>
            {savingShop ? t("settings.saving") : t("settings.save")}
          </Button>
        </CardContent>
      </Card>

      {/* Hisob */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {t("settings.accountSection")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("settings.emailLabel")}</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" onClick={saveEmail} disabled={savingEmail}>
                {savingEmail ? t("settings.saving") : t("settings.save")}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">{t("settings.newPasswordLabel")}</Label>
            <div className="flex gap-2">
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                placeholder={t("settings.passwordPlaceholder")}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={savePassword}
                disabled={savingPw || !newPassword}
              >
                {savingPw ? t("settings.saving") : t("settings.save")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Excel eksport */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            {t("settings.exportSection")}
          </CardTitle>
          <CardDescription>{t("settings.exportDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("settings.exporting")}
              </>
            ) : (
              <>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {t("settings.exportBtn")}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
