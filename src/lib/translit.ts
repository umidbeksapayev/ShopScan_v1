/**
 * Qidiruv normalizatsiyasi — lotin/kiril harflarini bitta kanonik shaklga keltiradi.
 * Shu tufayli "olma", "Олма", "OLMA" — barchasi bir-biriga mos keladi.
 */

const CYR_TO_LAT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "x", ц: "ts",
  ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "i", ь: "", э: "e", ю: "yu",
  я: "ya", ў: "o", қ: "q", ғ: "g", ҳ: "h", ң: "ng",
};

/** Matnni qidiruv uchun normallashtiradi (kichik harf, kiril→lotin, belgilarsiz). */
export function normalizeSearch(input: string): string {
  const lower = input.toLowerCase().trim();
  let out = "";
  for (const ch of lower) {
    out += ch in CYR_TO_LAT ? CYR_TO_LAT[ch] : ch;
  }
  // Apostrof variantlari va ortiqcha bo'shliqlarni olib tashlaymiz
  return out.replace(/['`ʻ’ʼ]/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Mahsulot nomi qidiruv so'roviga mos keladimi (normalizatsiyalangan).
 * Boshidan mos kelganlar yuqorida turishi uchun `startsWith` ham qaytaramiz.
 */
export function matchScore(name: string, query: string): number {
  const n = normalizeSearch(name);
  const q = normalizeSearch(query);
  if (!q) return 0;
  if (n.startsWith(q)) return 2; // nom boshidan mos — eng yuqori
  if (n.includes(q)) return 1; // ichida bor
  return 0;
}
