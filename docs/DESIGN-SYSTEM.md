# uscan — Dizayn Tizimi

> Yagona rang palitrasi va komponent qoidalari. Premium, ammo sodda.
> Manba (source of truth): `src/app/globals.css` (tokenlar) + `tailwind.config.ts` (ulanish).

## 1. Rang palitrasi (semantik tokenlar)

Barcha ranglar HSL CSS o'zgaruvchilari sifatida saqlanadi va light/dark uchun avtomatik moslashadi.
Komponentlarda **xom hex YOZILMAYDI** — faqat semantik nom ishlatiladi (`bg-primary`, `text-success` …).

| Token | Vazifa | Light | Dark |
|-------|--------|-------|------|
| `primary` | Asosiy brend / asosiy CTA | to'q ko'k `#0F3D6E` | yorug'roq ko'k |
| `secondary` | Ikkilamchi yuza/tugma | och kulrang | to'q navy |
| `accent` | Hover / faol holat foni | och ko'k | to'q ko'k |
| `muted` / `muted-foreground` | Ikkilamchi matn, fon | — | — |
| `destructive` | Xavfli amal (o'chirish) | qizil | qizil |
| `success` | Muvaffaqiyat / tasdiq | emerald | yorug'roq emerald |
| `warning` | Ogohlantirish | amber | yorug'roq amber |
| `border` / `input` / `ring` | Chegara, input, fokus halqasi | — | — |

**Brend gradient:** `bg-brand-gradient` (yorqin ko'k → to'q ko'k) — faqat asosiy CTA va logo uchun.

## 2. Tugma ierarxiyasi (`<Button variant size>`)

Bir ekranда **faqat bitta asosiy (primary) CTA** bo'lsin; qolganlari unга bo'ysunsin.

| Variant | Qachon ishlatiladi |
|---------|--------------------|
| `default` | Asosiy harakat (gradient). Sahifada bittadan ortmasin. |
| `secondary` | Ikkilamchi harakat |
| `outline` | Uchinchi darajali / "Bekor qilish" |
| `ghost` | Eng past urg'u (toolbar, ikon tugmalar) |
| `success` | Tasdiqlash/yakunlash (masalan "Sotish") |
| `warning` | Ehtiyot talab qiluvchi, ammo xavfsiz amal |
| `destructive` | O'chirish/qaytarib bo'lmaydigan amal |
| `link` | Matn ichидаги havola |

**O'lchamlar:** `sm` (h-9) · `default` (h-10) · `lg` (h-11) · `xl` (h-12, asosiy/checkout uchun) · `icon` (kvadrat).

**Holatlar** (barcha variantlar uchun avtomatik):
- `hover` — yorug'lik/fon o'zgaradi
- `active` — `scale-[0.98]` bosish hissi
- `disabled` — `opacity-50`, bosib bo'lmaydi
- `focus-visible` — 2px rang halqasi (klaviatura a11y)

## 3. Yuzalar va soyalar

| Soya | Qo'llanish |
|------|-----------|
| `shadow-soft` | Kartlar (tinch) |
| `shadow-card` | Karta hover |
| `shadow-pop` | Gradient CTA / faol element |

Radius: `--radius = 0.85rem` (`rounded-lg/xl/2xl`).

## 4. Qoidalar (qisqacha)

- Matn kontrasti ≥ 4.5:1 (kichik matn), ikonkalar ≥ 3:1.
- Ranг yagona signal bo'lmasin — ikon/matn bilan birga (masalan qoldiq holati).
- Pul/sonlar uchun `tabular-nums`.
- Ikonkalar faqat `lucide-react` (emoji ishlatilmaydi).
- Yangi matn → 3 til fayliga (`uz-Latn`, `uz-Cyrl`, `ru`) qo'shilsin.
