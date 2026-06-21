"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  ScanLine,
  Sparkles,
  Search,
  Scale,
  BarChart3,
  Zap,
  Moon,
  ArrowRight,
  Check,
  ShieldCheck,
  Package,
  Download,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useAppVersion } from "@/hooks/use-app-update";

const features: { icon: LucideIcon; titleKey: string; descKey: string; cls: string }[] = [
  { icon: ScanLine, titleKey: "landing.feature1Title", descKey: "landing.feature1Desc", cls: "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300" },
  { icon: Search, titleKey: "landing.feature2Title", descKey: "landing.feature2Desc", cls: "bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300" },
  { icon: Scale, titleKey: "landing.feature3Title", descKey: "landing.feature3Desc", cls: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300" },
  { icon: BarChart3, titleKey: "landing.feature4Title", descKey: "landing.feature4Desc", cls: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300" },
  { icon: Zap, titleKey: "landing.feature5Title", descKey: "landing.feature5Desc", cls: "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300" },
  { icon: Moon, titleKey: "landing.feature6Title", descKey: "landing.feature6Desc", cls: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300" },
];

const steps = [
  { n: "1", titleKey: "landing.step1Title", descKey: "landing.step1Desc" },
  { n: "2", titleKey: "landing.step2Title", descKey: "landing.step2Desc" },
  { n: "3", titleKey: "landing.step3Title", descKey: "landing.step3Desc" },
];

/** Hero yonidagi ilova ko'rinishi — foydalanuvchi nimani olishini darhol ko'rsatadi. */
function AppPreview() {
  const { t } = useTranslation();
  const rows: { name: string; price: string; unit: string; status: string; variant: "success" | "warning" }[] = [
    { name: "Coca-Cola 1.5L", price: "12 000", unit: t("common.pcs"), status: t("catalog.statusOk"), variant: "success" },
    { name: "Guruch", price: "18 500", unit: t("common.kg"), status: t("catalog.statusOk"), variant: "success" },
    { name: "Shampun", price: "32 000", unit: t("common.pcs"), status: t("catalog.statusLow"), variant: "warning" },
  ];

  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-5 -z-10 rounded-[2.5rem] bg-brand-gradient opacity-20 blur-2xl"
      />
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
        {/* Faux topbar */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-gradient text-primary-foreground">
            <ScanLine className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold text-foreground">
            {t("auth.shopNamePlaceholder")}
          </span>
          <span className="ml-auto text-xs text-muted-foreground">{t("nav.products")}</span>
        </div>

        {/* Mahsulot qatorlari */}
        <div className="divide-y divide-border">
          {rows.map((r) => (
            <div key={r.name} className="flex items-center gap-3 px-4 py-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground/50">
                <Package className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{r.name}</p>
                <Badge variant={r.variant} className="mt-0.5 text-[10px]">
                  {r.status}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold tabular-nums text-foreground">{r.price}</p>
                <p className="text-[10px] text-muted-foreground">/ {r.unit}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Muvaffaqiyatli sotuv toast */}
        <div className="m-3 flex items-center gap-2 rounded-xl bg-success px-3 py-2 text-sm font-medium text-success-foreground shadow-sm">
          <Check className="h-4 w-4 shrink-0" /> {t("landing.previewSold")} — 62 500
        </div>
      </div>
    </div>
  );
}

export function LandingContent() {
  const { t } = useTranslation();
  const { data: appVersion } = useAppVersion();

  const stats = [
    { value: t("landing.stat1Value"), label: t("landing.stat1Label") },
    { value: t("landing.stat2Value"), label: t("landing.stat2Label") },
    { value: t("landing.stat3Value"), label: t("landing.stat3Label") },
  ];

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo className="h-7 w-auto text-foreground" />
          <div className="flex items-center gap-1 sm:gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {t("landing.ctaLogin")}
            </Link>
            <Link
              href="/register"
              className="hidden rounded-xl bg-brand-gradient px-4 py-2 text-sm font-medium text-primary-foreground shadow-pop transition-all hover:brightness-110 sm:inline-block"
            >
              {t("landing.ctaStart")}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto w-full max-w-6xl overflow-hidden px-4 pb-12 pt-14 sm:px-6 sm:pt-20">
        {/* Dekorativ gradient blob */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-72 w-[36rem] max-w-full -translate-x-1/2 rounded-full bg-brand-gradient opacity-20 blur-3xl"
        />
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Chap: matn */}
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
              <Sparkles className="h-3.5 w-3.5" /> {t("landing.badge")}
            </span>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:mx-0">
              {t("landing.heroTitle1")}{" "}
              <span className="text-brand-gradient">{t("landing.heroAccent")}</span>{" "}
              {t("landing.heroTitle2")}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg lg:mx-0">
              {t("landing.heroDesc")}
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap lg:justify-start">
              <Link
                href="/register"
                className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-brand-gradient px-6 py-3 text-base font-semibold text-primary-foreground shadow-pop transition-all hover:brightness-110 active:scale-[0.98] sm:w-auto"
              >
                {t("landing.ctaStart")} <ArrowRight className="h-4 w-4 shrink-0" />
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center whitespace-nowrap rounded-xl border border-border bg-card px-6 py-3 text-base font-semibold transition-colors hover:bg-accent active:scale-[0.98] sm:w-auto"
              >
                {t("landing.ctaLogin")}
              </Link>
              {appVersion?.apkUrl && (
                <a
                  href={appVersion.apkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-border bg-card px-6 py-3 text-base font-semibold transition-colors hover:bg-accent active:scale-[0.98] sm:w-auto"
                >
                  <Download className="h-4 w-4 shrink-0" /> {t("app.downloadAndroid")}
                </a>
              )}
            </div>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground lg:justify-start">
              <ShieldCheck className="h-3.5 w-3.5" /> {t("landing.noCard")}
            </p>

            {/* Statistika */}
            <div className="mt-8 grid max-w-md grid-cols-3 gap-3 lg:mx-0">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-border bg-card px-2 py-3 text-center shadow-soft"
                >
                  <p className="text-lg font-bold text-foreground sm:text-xl">{s.value}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* O'ng: ilova ko'rinishi */}
          <div className="mt-4 lg:mt-0">
            <AppPreview />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">{t("landing.featuresTitle")}</h2>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.titleKey}
                className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-card"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${f.cls}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{t(f.titleKey)}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{t(f.descKey)}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">{t("landing.howTitle")}</h2>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.n} className="relative text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-lg font-bold text-primary-foreground shadow-pop">
                {s.n}
              </div>
              {i < steps.length - 1 && (
                <div
                  aria-hidden
                  className="absolute left-[calc(50%+2rem)] top-6 hidden h-px w-[calc(100%-4rem)] bg-border sm:block"
                />
              )}
              <h3 className="mt-4 font-semibold">{t(s.titleKey)}</h3>
              <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground">{t(s.descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
          {["landing.trust1", "landing.trust2", "landing.trust3"].map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-500" /> {t(k)}
            </span>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-brand-gradient px-6 py-12 text-center text-primary-foreground shadow-pop sm:px-12">
          <h2 className="text-2xl font-bold sm:text-3xl">{t("landing.finalTitle")}</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">{t("landing.finalDesc")}</p>
          <Link
            href="/register"
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-primary shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {t("landing.ctaStart")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <Logo className="h-6 w-auto text-foreground" />
          <p>{t("landing.footer")}</p>
        </div>
      </footer>
    </div>
  );
}
