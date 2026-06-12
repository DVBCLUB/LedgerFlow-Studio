import fs from 'fs';
import path from 'path';

const outDir = path.join(process.cwd(), 'build');
const outFile = path.join(outDir, 'icon.ico');

function writeUInt16LE(buffer, value, offset) {
  buffer.writeUInt16LE(value, offset);
}

function writeUInt32LE(buffer, value, offset) {
  buffer.writeUInt32LE(value, offset);
}

function createDibIconImage(size) {
  const headerSize = 40;
  const pixelBytes = size * size * 4;
  const maskStride = Math.ceil(size / 32) * 4;
  const maskBytes = maskStride * size;
  const totalBytes = headerSize + pixelBytes + maskBytes;
  const buffer = Buffer.alloc(totalBytes);

  // BITMAPINFOHEADER. In ICO files, biHeight is XOR bitmap height + AND mask height.
  writeUInt32LE(buffer, headerSize, 0); // biSize
  writeUInt32LE(buffer, size, 4); // biWidth
  writeUInt32LE(buffer, size * 2, 8); // biHeight
  writeUInt16LE(buffer, 1, 12); // biPlanes
  writeUInt16LE(buffer, 32, 14); // biBitCount
  writeUInt32LE(buffer, 0, 16); // BI_RGB
  writeUInt32LE(buffer, pixelBytes + maskBytes, 20); // biSizeImage
  writeUInt32LE(buffer, 0, 24); // biXPelsPerMeter
  writeUInt32LE(buffer, 0, 28); // biYPelsPerMeter
  writeUInt32LE(buffer, 0, 32); // biClrUsed
  writeUInt32LE(buffer, 0, 36); // biClrImportant

  const center = (size - 1) / 2;
  const radius = size * 0.42;
  const pixelOffset = headerSize;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      // DIB pixels are stored bottom-up.
      const destY = size - 1 - y;
      const idx = pixelOffset + (destY * size + x) * 4;
      const dx = x - center;
      const dy = y - center;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const inside = distance <= radius;

      const edge = Math.max(0, Math.min(1, (radius - distance) / (size * 0.08)));
      const alpha = inside ? Math.round(255 * Math.max(0.82, edge)) : 0;

      // LedgerFlow mark: deep navy circle with cyan ledger bars.
      let r = 15;
      let g = 23;
      let b = 42;

      const barTop = size * 0.32;
      const barBottom = size * 0.68;
      const barWidth = size * 0.08;
      const gap = size * 0.055;
      const startX = size * 0.32;
      const isBar =
        y >= barTop &&
        y <= barBottom &&
        [0, 1, 2].some((i) => {
          const bx = startX + i * (barWidth + gap);
          const h = (i + 1) * size * 0.09 + size * 0.12;
          return x >= bx && x <= bx + barWidth && y >= barBottom - h;
        });

      if (isBar) {
        r = 34;
        g = 211;
        b = 238;
      }

      // BGRA
      buffer[idx] = b;
      buffer[idx + 1] = g;
      buffer[idx + 2] = r;
      buffer[idx + 3] = alpha;
    }
  }

  // AND mask remains all zero: alpha channel controls transparency.
  return buffer;
}

function createIco(sizes) {
  const images = sizes.map((size) => ({ size, data: createDibIconImage(size) }));
  const dirSize = 6 + images.length * 16;
  const totalSize = dirSize + images.reduce((sum, image) => sum + image.data.length, 0);
  const ico = Buffer.alloc(totalSize);

  writeUInt16LE(ico, 0, 0); // reserved
  writeUInt16LE(ico, 1, 2); // image type: icon
  writeUInt16LE(ico, images.length, 4);

  let offset = dirSize;
  images.forEach((image, index) => {
    const entryOffset = 6 + index * 16;
    ico[entryOffset] = image.size === 256 ? 0 : image.size;
    ico[entryOffset + 1] = image.size === 256 ? 0 : image.size;
    ico[entryOffset + 2] = 0; // color count
    ico[entryOffset + 3] = 0; // reserved
    writeUInt16LE(ico, 1, entryOffset + 4); // planes
    writeUInt16LE(ico, 32, entryOffset + 6); // bit count
    writeUInt32LE(ico, image.data.length, entryOffset + 8);
    writeUInt32LE(ico, offset, entryOffset + 12);
    image.data.copy(ico, offset);
    offset += image.data.length;
  });

  return ico;
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, createIco([16, 32, 48, 64, 128, 256]));
console.log(`[icons] Wrote valid Windows desktop icon with 256px entry: ${outFile}`);
