/**
 * Generates placeholder PNG assets (icon, adaptive-icon, splash) with no deps.
 * Draws a solid brand-green background with a simple yin-yang-ish circle motif.
 * Produces valid PNGs via a tiny encoder (zlib from Node core).
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  // raw image data with filter byte per row
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function makeImage(size, opts) {
  const { bg, transparentBg } = opts;
  const rgba = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.34; // outer circle radius
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      let r = bg[0], g = bg[1], b = bg[2], a = transparentBg ? 0 : 255;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= R) {
        // Taiji circle: left half light, right half dark, split by an S-curve approximation
        const inTop = dy < 0;
        // small circles
        const dTopDot = Math.sqrt(dx * dx + (dy + R / 2) * (dy + R / 2));
        const dBotDot = Math.sqrt(dx * dx + (dy - R / 2) * (dy - R / 2));
        let dark;
        if (dBotDot < R / 2) dark = true;
        else if (dTopDot < R / 2) dark = false;
        else dark = dx > 0; // left light / right dark (simplified)
        if (inTop !== undefined) { /* keep */ }
        if (dark) { r = 20; g = 50; b = 40; a = 255; }
        else { r = 240; g = 246; b = 243; a = 255; }
        // dots
        if (dTopDot < R * 0.12) { r = 20; g = 50; b = 40; }
        if (dBotDot < R * 0.12) { r = 240; g = 246; b = 243; }
      }
      rgba[i] = r; rgba[i + 1] = g; rgba[i + 2] = b; rgba[i + 3] = a;
    }
  }
  return encodePNG(size, size, rgba);
}

const brand = [14, 122, 95];
const outDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, 'icon.png'), makeImage(1024, { bg: brand }));
fs.writeFileSync(path.join(outDir, 'adaptive-icon.png'), makeImage(1024, { bg: brand, transparentBg: true }));
fs.writeFileSync(path.join(outDir, 'splash-icon.png'), makeImage(1024, { bg: brand, transparentBg: true }));
fs.writeFileSync(path.join(outDir, 'favicon.png'), makeImage(48, { bg: brand }));

console.log('Assets generated in', outDir);
