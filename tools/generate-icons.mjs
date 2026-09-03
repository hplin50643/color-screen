// Reproducible, dependency-free rasterization of our geometric SVG app icon.
// Only generated icon assets are written; a build is not required to use the app.
import { deflateSync } from 'node:zlib';
import { writeFile } from 'node:fs/promises';

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const bytes = Buffer.from(type), length = Buffer.alloc(4), crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([bytes, data])));
  return Buffer.concat([length, bytes, data, crc]);
}
function rounded(x, y, left, top, size, radius) {
  if (x < left || y < top || x > left + size || y > top + size) return false;
  const dx = Math.max(left + radius - x, 0, x - (left + size - radius));
  const dy = Math.max(top + radius - y, 0, y - (top + size - radius));
  return dx * dx + dy * dy <= radius * radius;
}
function icon(size) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let coverage = 0;
    for (let sy = 0; sy < 3; sy++) for (let sx = 0; sx < 3; sx++) {
      const px = (x + (sx + .5) / 3) * 512 / size, py = (y + (sy + .5) / 3) * 512 / size;
      if ((rounded(px, py, 112, 112, 288, 72) && !rounded(px, py, 128, 128, 256, 56)) || rounded(px, py, 198, 198, 116, 24)) coverage++;
    }
    const mix = coverage / 9, offset = y * (size * 4 + 1) + 1 + x * 4;
    raw[offset] = raw[offset + 1] = Math.round(17 + (241 - 17) * mix);
    raw[offset + 2] = Math.round(19 + (243 - 19) * mix); raw[offset + 3] = 255;
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
for (const [name, size] of [['icon-192.png',192],['icon-512.png',512],['icon-maskable-512.png',512],['apple-touch-icon.png',180]]) {
  await writeFile(new URL(`../icons/${name}`, import.meta.url), icon(size));
  console.log(`${name}: ${size} × ${size}`);
}
