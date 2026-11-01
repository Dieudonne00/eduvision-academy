// Turns the original photos in imgs/ into web-sized images in public/images/.
// Run with: node scripts/optimize-images.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const SRC = "imgs";
const OUT = "public/images";
await mkdir(OUT, { recursive: true });

const photos = [
  ["file_00000000d5587246867b84d76d37fc26.png", "class-photography.webp", 1600],
  ["file_000000003f308210822c3cd43c8b4525.png", "exam-room.webp", 1400],
  ["file_00000000aecc71f496f6097f6d7acf34.png", "instructor-studio.webp", 1000],
  ["file_000000007f9081fd97f888789c4454fb.png", "storefront.webp", 1000],
  ["file_0000000099c07243a6d64650756819a4.png", "front-desk.webp", 900],
  ["file_000000008c10820bbe7baac9a54004d0.png", "lesson-camera-angles.webp", 1400],
  ["file_00000000d55c820b8944e97b434ae2ec.png", "lesson-shot-types.webp", 1400],
];

for (const [file, name, width] of photos) {
  const info = await sharp(`${SRC}/${file}`)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(`${OUT}/${name}`);
  console.log(`${name}: ${info.width}x${info.height}, ${Math.round(info.size / 1024)} KB`);
}

// Full logo, trimmed of its white margin
const logo = await sharp(`${SRC}/EDUVISION ACADEMY PNG.png`)
  .flatten({ background: "#ffffff" })
  .trim({ background: "#ffffff", threshold: 20 })
  .resize({ width: 900 })
  .png({ compressionLevel: 9 })
  .toFile(`${OUT}/logo.png`);
console.log(`logo.png: ${logo.width}x${logo.height}, ${Math.round(logo.size / 1024)} KB`);

// Eye mark only (top part of the logo), used in the header and as the site icon
// (sharp runs trim before extract within one pipeline, so crop first, then trim separately)
const eyeOnly = await sharp(`${SRC}/EDUVISION ACADEMY PNG.png`)
  .flatten({ background: "#ffffff" })
  .extract({ left: 650, top: 540, width: 3600, height: 2380 })
  .toBuffer();
const markBuffer = await sharp(eyeOnly).trim({ background: "#ffffff", threshold: 20 }).toBuffer();

const mark = await sharp(markBuffer).resize({ width: 240 }).png({ compressionLevel: 9 }).toFile(`${OUT}/logo-mark.png`);
console.log(`logo-mark.png: ${mark.width}x${mark.height}`);

await sharp(markBuffer)
  .resize(400, 400, { fit: "contain", background: "#ffffff" })
  .extend({ top: 56, bottom: 56, left: 56, right: 56, background: "#ffffff" })
  .resize(512, 512)
  .png()
  .toFile("app/icon.png");
console.log("app/icon.png: 512x512");
