# uscan — Design System (MASTER)

> Yagona dizayn manbai (Source of Truth). uscan 2.0 — F-3 premium dizayn.
> Stack: Next.js 14 + Tailwind + shadcn/ui. Tokenlar: `src/app/globals.css`, `tailwind.config.ts`.

## Brend
**to'q ko'k (blue)** primary + yorqin ko'k urg'u, sovuq och fon, navy matn. Toza, zamonaviy, POS uchun.

## Ranglar (HSL tokenlar — semantik)
Komponentlarda HEX emas, **semantik token** ishlating (`bg-primary`, `text-foreground`, `bg-card`, `text-muted-foreground`, `bg-accent`, `border-border`, `bg-destructive`).

| Token | Light | Dark |
|-------|-------|------|
| `--primary` | `211 76% 25%` (#0F3D6E) | `214 84% 58%` |
| `--background` | `228 27% 97%` | `234 24% 10%` |
| `--foreground` | `234 45% 12%` | `0 0% 98%` |
| `--card` | `0 0% 100%` | `234 22% 13%` |
| `--muted-foreground` | `235 9% 54%` | `235 14% 66%` |
| `--destructive` | `0 84% 60%` | `0 70% 55%` |

**Status ranglar** (hardcoded, semantik bo'lmagan): yashil=muvaffaqiyat/foyda, qizil=tugagan/xato, amber/orange=kam qoldiq, ko'k=barcode. Har doim **ikona/matn bilan** birga (rang yolg'iz emas — a11y).

## Tipografiya
- Shrift: **Inter** (`next/font`), `antialiased` + `optimizeLegibility`.
- Body 14–16px, sarlavhalar `font-bold`/`font-semibold`, labellar `font-medium`.
- Raqamlar/narx/vaqt: **`tabular-nums`** (ustun siljimaydi).

## Spacing & Layout
- 4/8px ritm (Tailwind default). Konteyner: `max-w-6xl`.
- Radius: `--radius: 0.85rem` (lg). Kartlar `rounded-2xl` (1.25rem), tugmalar `rounded-md/xl`.
- Mobile-first; `(dashboard)` da desktop sidebar (hamma havola) + mobil bottom-nav **≤5 tugma** (4 asosiy: Bosh/Katalog/Sotuv/Tarix + "Ko'proq" menyusi qolganlari uchun). 5 tadan oshmasin — telefonda noqulay.

## Effektlar (soyalar)
- `shadow-soft` — nozik (kartlar tinch holati)
- `shadow-card` — ko'tarilgan (hover/muhim kartlar)
- `shadow-pop` — primary tusli (asosiy CTA, faol nav)

## Interaksiya & Animatsiya (skill §2, §7)
- O'tishlar **150–300ms**, `transition-all`/`transition-colors`.
- Tugma/bosiladigan: `active:scale-[0.98]` (taktil his), `cursor-pointer`.
- Hover holatlari aniq (`hover:bg-accent`, `hover:shadow-md`).
- Touch target ≥ 44px.

## Accessibility (skill §1)
- `focus-visible:ring-2 ring-ring` — klaviatura fokusi barcha tugmalarda.
- Kontrast ≥ 4.5:1 (matn). Ikona-only tugmalarda `aria-label`.
- **`prefers-reduced-motion`** hurmat qilinadi (globals.css).
- Rang yolg'iz ma'no tashimaydi — ikona/matn qo'shiladi.

## Ikonalar
**Lucide** (`lucide-react`) — yagona oila, emoji EMAS. Bir xil stroke. Rasm bo'lmasa `ProductThumb` placeholder.

## i18n
3 til: `uz-Latn` (default), `uz-Cyrl`, `ru` (`src/i18n/locales/`). Yangi matn — 3 tilga ham.

## Sahifa override'lari
Sahifaga xos chetlanishlar `design-system/pages/<page>.md` da. Bo'lmasa — shu MASTER amal qiladi.
