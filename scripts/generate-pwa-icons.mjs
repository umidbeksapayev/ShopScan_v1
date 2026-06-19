// PWA ikonalarini src/app/icon.svg dan generatsiya qiladi (bir martalik).
// Ishga tushirish: node scripts/generate-pwa-icons.mjs
import sharp from "sharp";
import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");
mkdirSync(pub, { recursive: true });

const BRAND = "#0F3D6E";
const svg = readFileSync(join(root, "src/app/icon.svg"));

// "any" ikonalar — asl SVG (yumaloq burchak)
await sharp(svg, { density: 512 }).resize(192, 192).png().toFile(join(pub, "icon-192.png"));
await sharp(svg, { density: 512 }).resize(512, 512).png().toFile(join(pub, "icon-512.png"));
await sharp(svg, { density: 512 }).resize(180, 180).png().toFile(join(pub, "apple-icon-180.png"));

// "maskable" — to'liq kvadrat brend foni + markazda ikona (xavfsiz zona)
const inner = await sharp(svg, { density: 512 }).resize(320, 320).png().toBuffer();
await sharp({
  create: { width: 512, height: 512, channels: 4, background: BRAND },
})
  .composite([{ input: inner, gravity: "center" }])
  .png()
  .toFile(join(pub, "icon-maskable-512.png"));

console.log("PWA ikonalar yaratildi: public/icon-{192,512}.png, icon-maskable-512.png, apple-icon-180.png");
