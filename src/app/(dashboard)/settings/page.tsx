"use client";

import { useEffect, useState } from "react";
import {
  Store,
  User,
  FileSpreadsheet,
  Loader2,
  SlidersHorizontal,
  Shield,
  Languages,
  Coins,
  Sun,
  Moon,
  Monitor,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { authErrorKey } from "@/lib/auth-errors";
import { useShop } from "@/hooks/use-shop";
import { useOwnerGuard } from "@/hooks/use-guards";
import { listProducts } from "@/lib/products";
import { exportProductsXlsx } from "@/lib/excel";
import { LANGUAGES, LANG_STORAGE_KEY } from "@/i18n/config";
import { cn } from "@/lib/utils";
import { LogoUploader } from "@/components/settings/logo-uploader";
import { OwnerTelegramCard } from "@/components/settings/owner-telegram-card";
import { AcquiringCard } from "@/components/settings/acquiring-card";
import { FeedbackCard } from "@/components/settings/feedback-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const { data: shop } = useShop();
  const { theme, setTheme } = useTheme();

  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingShop, setSavingShop] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { checking } = useOwnerGuard();

  useEffect(() => setMounted(true), []);

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
      qc.invalidateQueries({ queryKey: ["memberships"] });
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
      const products = await listProducts({ shopId: shop?.id });
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

  function setLang(code: string) {
    i18n.changeLanguage(code);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, code);
    } catch {
      /* localStorage yo'q bo'lsa jim o'tadi */
    }
  }

  const themeOptions: { value: string; label: string; icon: LucideIcon }[] = [
    { value: "light", label: t("settings.themeLight"), icon: Sun },
    { value: "dark", label: t("settings.themeDark"), icon: Moon },
    { value: "system", label: t("settings.themeSystem"), icon: Monitor },
  ];
  const currentTheme = mounted ? theme : undefined;

  const tabs: { value: string; label: string; icon: LucideIcon }[] = [
    { value: "profile", label: t("settings.tabProfile"), icon: Store },
    { value: "prefs", label: t("settings.tabPrefs"), icon: SlidersHorizontal },
    { value: "security", label: t("settings.tabSecurity"), icon: Shield },
    { value: "data", label: t("settings.tabData"), icon: FileSpreadsheet },
  ];

  if (checking) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t("settings.title")}</h1>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-4 gap-1 p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                aria-label={tab.label}
                className="flex-col gap-1 py-2 sm:flex-row sm:gap-1.5"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-[11px] sm:text-sm">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* ===== Profil ===== */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Store className="h-5 w-5 text-primary" />
                {t("settings.profileSection")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {shop && (
                <div className="space-y-2">
                  <Label>{t("settings.logoLabel")}</Label>
                  <LogoUploader shopId={shop.id} logoUrl={shop.logo_url} />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="shopName">{t("settings.shopNameLabel")}</Label>
                <div className="flex gap-2">
                  <Input
                    id="shopName"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={saveShopName} disabled={savingShop || !shopName.trim()}>
                    {savingShop ? t("settings.saving") : t("settings.save")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {shop && <AcquiringCard shop={shop} />}
          {shop && <OwnerTelegramCard shop={shop} />}
        </TabsContent>

        {/* ===== Afzalliklar ===== */}
        <TabsContent value="prefs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
                {t("settings.prefsSection")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Til */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Languages className="h-4 w-4 text-muted-foreground" />
                  {t("settings.languageLabel")}
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => setLang(l.code)}
                      className={cn(
                        "rounded-xl border py-2.5 text-sm font-medium transition-colors",
                        i18n.language === l.code
                          ? "border-primary bg-accent text-primary"
                          : "border-input bg-background text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mavzu */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-muted-foreground" />
                  {t("settings.themeLabel")}
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {themeOptions.map((opt) => {
                    const Icon = opt.icon;
                    const active = currentTheme === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setTheme(opt.value)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-medium transition-colors",
                          active
                            ? "border-primary bg-accent text-primary"
                            : "border-input bg-background text-muted-foreground hover:bg-muted"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Valyuta (hozircha so'm) */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-muted-foreground" />
                  {t("settings.currencyLabel")}
                </Label>
                <div className="flex items-center justify-between rounded-xl border border-input bg-muted/40 px-4 py-2.5 text-sm">
                  <span className="font-medium text-foreground">{"so'm (UZS)"}</span>
                  <span className="text-xs text-muted-foreground">
                    {t("settings.currencyNote")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <FeedbackCard shop={shop} />
        </TabsContent>

        {/* ===== Xavfsizlik ===== */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
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
                    autoComplete="email"
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
        </TabsContent>

        {/* ===== Ma'lumotlar ===== */}
        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
