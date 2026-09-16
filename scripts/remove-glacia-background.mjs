/**
 * remove-glacia-background.mjs
 * ============================================================
 * One-off asset helper: remove the light "frost" background from the
 * Glacia mascot images so the character renders as a clean transparent
 * cutout (instead of a light rectangle in the 3D hologram stage).
 *
 * The source images are AI-generated PNGs with a soft blue-grey gradient
 * background. This script flood-fills the background from the image borders
 * using an edge-aware local tolerance, then writes transparent RGBA PNGs.
 *
 * Usage: node scripts/remove-glacia-background.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const TARGETS = ['glacia-avatar.png', 'glacia-clean.png'];

// Tuning knobs (RGB, 0-255). Tuned for the light frosty blue-grey background.
const MIN_BRIGHTNESS = 128; // keep: anything darker is treated as character
const MAX_SATURATION = 72;  // keep: colourful parts (cyan amulet, blue eyes/body)
const LOCAL_TOLERANCE = 30; // sum(|dr|+|dg|+|db|) between adjacent background px

function isBackgroundPixel(data, i, refR, refG, refB) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const brightness = (r + g + b) / 3;
  if (brightness < MIN_BRIGHTNESS) return false;
  const sat = Math.max(r, g, b) - Math.min(r, g, b);
  if (sat > MAX_SATURATION) return false;
  // Global sanity check vs border-average background tone.
  const globalDist = Math.abs(r - refR) + Math.abs(g - refG) + Math.abs(b - refB);
  if (globalDist > 130) return false;
  return true;
}

function removeBackground(srcPath, outPath) {
  const png = PNG.sync.read(fs.readFileSync(srcPath));
  const { width: w, height: h, data } = png;

  // Reference background tone from the image border.
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let count = 0;
  for (let x = 0; x < w; x += 2) {
    for (const y of [0, 1, h - 2, h - 1]) {
      const i = (y * w + x) * 4;
      sumR += data[i];
      sumG += data[i + 1];
      sumB += data[i + 2];
      count += 1;
    }
  }
  for (let y = 0; y < h; y += 2) {
    for (const x of [0, 1, w - 2, w - 1]) {
      const i = (y * w + x) * 4;
      sumR += data[i];
      sumG += data[i + 1];
      sumB += data[i + 2];
      count += 1;
    }
  }
  const refR = sumR / count;
  const refG = sumG / count;
  const refB = sumB / count;

  const visited = new Uint8Array(w * h);
  const bg = new Uint8Array(w * h);

  // Fast circular-ish queue (flat array + head pointer).
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;

  const trySeed = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x;
    if (visited[p]) return;
    visited[p] = 1;
    const i = p * 4;
    if (isBackgroundPixel(data, i, refR, refG, refB)) {
      bg[p] = 1;
      queue[tail++] = p;
    }
  };

  // Seed from all four borders.
  for (let x = 0; x < w; x++) {
    trySeed(x, 0);
    trySeed(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    trySeed(0, y);
    trySeed(w - 1, y);
  }

  while (head < tail) {
    const p = queue[head++];
    const x = p % w;
    const y = (p / w) | 0;
    const i = p * 4;
    const pr = data[i];
    const pg = data[i + 1];
    const pb = data[i + 2];

    // Neighbours must be locally similar (smooth gradient) AND background-like.
    const consider = (nx, ny) => {
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
      const q = ny * w + nx;
      if (visited[q]) return;
      visited[q] = 1;
      const qi = q * 4;
      const localDist =
        Math.abs(data[qi] - pr) + Math.abs(data[qi + 1] - pg) + Math.abs(data[qi + 2] - pb);
      if (localDist > LOCAL_TOLERANCE) return;
      if (!isBackgroundPixel(data, qi, refR, refG, refB)) return;
      bg[q] = 1;
      queue[tail++] = q;
    };

    consider(x + 1, y);
    consider(x - 1, y);
    consider(x, y + 1);
    consider(x, y - 1);
  }

  // ── Post-processing: defringe (remove dark outline) + speckle cleanup + feather ──

  // 1. Dilate the background mask a few pixels to eat the dark anti-aliased
  //    outline around the character (the "black smudge" fringe left by the
  //    original render against the light background).
  let mask = bg;
  const DILATE_ITERATIONS = 2;
  for (let iter = 0; iter < DILATE_ITERATIONS; iter++) {
    const next = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = y * w + x;
        if (mask[p]) {
          next[p] = 1;
          continue;
        }
        if (
          (x > 0 && mask[p - 1]) ||
          (x < w - 1 && mask[p + 1]) ||
          (y > 0 && mask[p - w]) ||
          (y < h - 1 && mask[p + w])
        ) {
          next[p] = 1;
        }
      }
    }
    mask = next;
  }

  // 2. Drop small isolated foreground islands (floating glow/crystal flecks)
  //    — keep only the largest connected foreground component (the character).
  const fgSeen = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  const components = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const seed = y * w + x;
      if (mask[seed] || fgSeen[seed]) continue;
      let top = 0;
      stack[top++] = seed;
      fgSeen[seed] = 1;
      const comp = [];
      while (top > 0) {
        const c = stack[--top];
        comp.push(c);
        const cx = c % w;
        const cy = (c / w) | 0;
        const n1 = c - 1;
        const n2 = c + 1;
        const n3 = c - w;
        const n4 = c + w;
        if (cx > 0 && !fgSeen[n1] && !mask[n1]) { fgSeen[n1] = 1; stack[top++] = n1; }
        if (cx < w - 1 && !fgSeen[n2] && !mask[n2]) { fgSeen[n2] = 1; stack[top++] = n2; }
        if (cy > 0 && !fgSeen[n3] && !mask[n3]) { fgSeen[n3] = 1; stack[top++] = n3; }
        if (cy < h - 1 && !fgSeen[n4] && !mask[n4]) { fgSeen[n4] = 1; stack[top++] = n4; }
      }
      components.push(comp);
    }
  }
  if (components.length > 1) {
    components.sort((a, b) => b.length - a.length);
    for (let i = 1; i < components.length; i++) {
      for (let k = 0; k < components[i].length; k++) {
        mask[components[i][k]] = 1;
      }
    }
  }

  // 3. Write alpha with a 1px feather at the silhouette edge.
  let removed = 0;
  for (let p = 0; p < w * h; p++) {
    if (mask[p]) {
      data[p * 4 + 3] = 0;
      removed += 1;
      continue;
    }
    const x = p % w;
    const y = (p / w) | 0;
    const nearBg =
      (x > 0 && mask[p - 1]) ||
      (x < w - 1 && mask[p + 1]) ||
      (y > 0 && mask[p - w]) ||
      (y < h - 1 && mask[p + w]);
    data[p * 4 + 3] = nearBg ? 190 : 255;
  }

  fs.writeFileSync(outPath, PNG.sync.write(png));
  console.log(
    `${path.relative(root, srcPath)} -> ${path.relative(root, outPath)}: removed ${(
      (100 * removed) / (w * h)
    ).toFixed(1)}% (${removed}/${w * h} px)`
  );
}

for (const name of TARGETS) {
  const src = path.join(root, 'public', name);
  if (!fs.existsSync(src)) {
    console.log(`skip (not found): ${name}`);
    continue;
  }
  const bak = path.join(root, 'public', name.replace(/\.png$/, '.original.png'));
  if (!fs.existsSync(bak)) fs.copyFileSync(src, bak);
  removeBackground(src, src);
}
console.log('Done. Backups saved as public/*.original.png');
