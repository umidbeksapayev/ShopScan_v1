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
  type LucideIcon,
} from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

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

export function LandingContent() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-primary-foreground shadow-pop">
              <ScanLine className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold">ShopScan</span>
          </div>
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
              className="rounded-xl bg-brand-gradient px-4 py-2 text-sm font-medium text-primary-foreground shadow-pop transition-all hover:brightness-110"
            >
              {t("landing.ctaStart")}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto w-full max-w-6xl overflow-hidden px-4 pt-16 pb-12 text-center sm:px-6 sm:pt-24">
        {/* Dekorativ gradient blob */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-72 w-[36rem] max-w-full -translate-x-1/2 rounded-full bg-brand-gradient opacity-20 blur-3xl"
        />
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          <Sparkles className="h-3.5 w-3.5" /> {t("landing.badge")}
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          {t("landing.heroTitle1")} <span className="text-brand-gradient">{t("landing.heroAccent")}</span> {t("landing.heroTitle2")}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
          {t("landing.heroDesc")}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-6 py-3 text-base font-semibold text-primary-foreground shadow-pop transition-all hover:brightness-110 sm:w-auto"
          >
            {t("landing.ctaStart")} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-xl border border-border bg-card px-6 py-3 text-base font-semibold transition-colors hover:bg-accent sm:w-auto"
          >
            {t("landing.ctaLogin")}
          </Link>
        </div>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" /> {t("landing.noCard")}
        </p>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          {steps.map((s) => (
            <div key={s.n} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-lg font-bold text-primary-foreground shadow-pop">
                {s.n}
              </div>
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
        <div className="rounded-3xl bg-brand-gradient px-6 py-12 text-center text-primary-foreground shadow-pop sm:px-12">
          <h2 className="text-2xl font-bold sm:text-3xl">{t("landing.finalTitle")}</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">{t("landing.finalDesc")}</p>
          <Link
            href="/register"
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-primary shadow-sm transition-transform hover:scale-[1.02]"
          >
            {t("landing.ctaStart")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-gradient text-primary-foreground">
              <ScanLine className="h-4 w-4" />
            </span>
            <span className="font-semibold text-foreground">ShopScan</span>
          </div>
          <p>{t("landing.footer")}</p>
        </div>
      </footer>
    </div>
  );
}
