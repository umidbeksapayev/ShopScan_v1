import Link from "next/link";
import {
  ScanLine,
  Sparkles,
  Scale,
  BarChart3,
  Zap,
  Moon,
  ArrowRight,
  Check,
  ShieldCheck,
} from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export const metadata = {
  title: "ShopScan — Aqlli Do'kon Boshqaruvi",
  description:
    "Barcode skanerlash, AI vizual qidiruv va real-time hisobotlar — kichik do'konlar uchun bepul POS tizimi.",
};

const features = [
  {
    icon: ScanLine,
    title: "Barcode skanerlash",
    desc: "Kamera mahsulotni avtomatik o'qiydi va 1 soniyada savatga qo'shadi.",
    cls: "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300",
  },
  {
    icon: Sparkles,
    title: "AI vizual qidiruv",
    desc: "Barcode yo'qmi? Mahsulotni suratga oling — tizim rasmga qarab topadi (CLIP).",
    cls: "bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300",
  },
  {
    icon: Scale,
    title: "DONALI va VAZN",
    desc: "Dona bilan ham, kilogramm bilan ham soting — 1 gramm aniqlikgacha.",
    cls: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
  },
  {
    icon: BarChart3,
    title: "Hisobot va dashboard",
    desc: "Kunlik tushum, sof foyda, eng ko'p sotilgan mahsulotlar — bir qarashda.",
    cls: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300",
  },
  {
    icon: Zap,
    title: "Tez va bepul",
    desc: "Server xarajati yo'q, AI brauzerda ishlaydi. Ro'yxatdan o'tib darhol boshlang.",
    cls: "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300",
  },
  {
    icon: Moon,
    title: "Mobil va tungi rejim",
    desc: "Telefon, planshet, kompyuter — qulay responsive interfeys, dark mode bilan.",
    cls: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300",
  },
];

const steps = [
  { n: "1", title: "Ro'yxatdan o'ting", desc: "30 soniyada do'kon hisobi yarating — email va parol." },
  { n: "2", title: "Mahsulot qo'shing", desc: "Rasm, narx va miqdorni kiriting. Barcode ixtiyoriy." },
  { n: "3", title: "Soting", desc: "Barcode, rasm yoki nom bo'yicha toping va savatga qo'shing." },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-pop">
              <ScanLine className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold">ShopScan</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Kirish
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-pop transition-colors hover:bg-primary/90"
            >
              Boshlash
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-16 pb-12 text-center sm:px-6 sm:pt-24">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          <Sparkles className="h-3.5 w-3.5" /> Aqlli POS tizimi — bepul
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Do&apos;koningizni{" "}
          <span className="text-primary">aqlli</span> boshqaring
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Barcode skanerlash, AI vizual qidiruv va real-time hisobotlar — bularning
          barchasi bitta oddiy tizimda. Telefon yoki kompyuterda, bepul.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-pop transition-colors hover:bg-primary/90 sm:w-auto"
          >
            Bepul boshlash <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-xl border border-border bg-card px-6 py-3 text-base font-semibold transition-colors hover:bg-accent sm:w-auto"
          >
            Kirish
          </Link>
        </div>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" /> Karta talab qilinmaydi · Darhol ishlaydi
        </p>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-card"
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${f.cls}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">
          Qanday ishlaydi?
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground shadow-pop">
                {s.n}
              </div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Security / trust strip */}
      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
          {[
            "Tan narxingiz maxfiy qoladi",
            "Ma'lumotlaringiz faqat sizniki",
            "Internetsiz ham asosiy ishlar",
          ].map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-500" /> {t}
            </span>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="rounded-3xl bg-primary px-6 py-12 text-center text-primary-foreground shadow-pop sm:px-12">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Bugun do&apos;koningizni raqamlashtiring
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
            Ro&apos;yxatdan o&apos;tish bepul va bir necha soniya. Kreditka kerak emas.
          </p>
          <Link
            href="/register"
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-primary shadow-sm transition-transform hover:scale-[1.02]"
          >
            Bepul boshlash <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ScanLine className="h-4 w-4" />
            </span>
            <span className="font-semibold text-foreground">ShopScan</span>
          </div>
          <p>© 2026 ShopScan — Aqlli do&apos;kon boshqaruvi</p>
        </div>
      </footer>
    </div>
  );
}
