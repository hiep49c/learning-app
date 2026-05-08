#!/bin/bash
# Create minimal PNG placeholder icons for Expo build
# These are 1x1 pixel transparent PNGs (smallest valid PNG)

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 22 2>/dev/null || true

node -e "
const fs = require('fs');
const path = require('path');

// Generate a simple colored PNG using raw bytes
// This creates a valid 512x512 PNG with a solid color
function createPNG(width, height, r, g, b) {
  // Use a simpler approach: create via canvas-like buffer
  // Actually, let's create a minimal valid PNG manually
  
  const { createCanvas } = (() => {
    try { return require('canvas'); } catch { return null; }
  })() || {};
  
  // Fallback: write raw PNG bytes for a 1x1 pixel
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk (width=1, height=1, bit depth=8, color type=2 RGB)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(1, 0);  // width
  ihdrData.writeUInt32BE(1, 4);  // height
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  
  function createChunk(type, data) {
    const typeBuffer = Buffer.from(type);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    const crcData = Buffer.concat([typeBuffer, data]);
    
    // CRC32
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < crcData.length; i++) {
      crc ^= crcData[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
      }
    }
    crc = (crc ^ 0xFFFFFFFF) >>> 0;
    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc, 0);
    
    return Buffer.concat([length, typeBuffer, data, crcBuffer]);
  }
  
  // IDAT chunk - one row: filter byte (0) + RGB pixel
  const rawData = Buffer.from([0, r, g, b]);
  
  // Deflate the raw data (use zlib)
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(rawData);
  
  // IEND chunk
  const ihdr = createChunk('IHDR', ihdrData);
  const idat = createChunk('IDAT', compressed);
  const iend = createChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdr, idat, iend]);
}

const assetsDir = path.join(process.cwd(), 'assets');

// Create icon.png (blue)
const icon = createPNG(1, 1, 0, 119, 182);
fs.writeFileSync(path.join(assetsDir, 'icon.png'), icon);
console.log('Created icon.png');

// Create splash-icon.png (blue)
fs.writeFileSync(path.join(assetsDir, 'splash-icon.png'), icon);
console.log('Created splash-icon.png');

// Create adaptive-icon.png (blue)
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), icon);
console.log('Created adaptive-icon.png');

// Create favicon.png (blue)
fs.writeFileSync(path.join(assetsDir, 'favicon.png'), icon);
console.log('Created favicon.png');

console.log('All icons created.');
"
