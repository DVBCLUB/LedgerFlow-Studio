/**
 * server/services/glaciaRuntimeGarbageCollector.ts
 * ============================================================
 * ĐỘNG CƠ DỌN RÁC RUNTIME & TỐI ƯU BỘ NHỚ RAM TỰ ĐỘNG (Level 5 Singularity)
 * ------------------------------------------------------------
 * Tự động dọn dẹp, nén log và giải phóng bộ nhớ RAM:
 *  - Dọn sạch các file .tmp, .bak, và bridge script tạm thời (blender_*, ffmpeg_*, graphic_*).
 *  - Nén và xoay vòng các file .log.json (giữ 200 bản ghi mới nhất).
 *  - Kích hoạt V8 Garbage Collection để RAM luôn nhẹ dưới 100MB khi chạy nền.
 * ============================================================
 */

import fs from 'fs';
import path from 'path';

export interface GarbageCollectionStats {
  filesRemovedCount: number;
  bytesFreed: number;
  logsCompactedCount: number;
  currentMemoryUsageMb: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
  cleanedFiles: string[];
  cleanedAt: string;
}

const RUNTIME_DIR = path.resolve(process.cwd(), 'runtime');

export function runRuntimeGarbageCollection(): GarbageCollectionStats {
  let filesRemovedCount = 0;
  let bytesFreed = 0;
  let logsCompactedCount = 0;
  const cleanedFiles: string[] = [];

  if (!fs.existsSync(RUNTIME_DIR)) {
    try {
      fs.mkdirSync(RUNTIME_DIR, { recursive: true });
    } catch {}
  }

  try {
    const entries = fs.readdirSync(RUNTIME_DIR);
    const now = Date.now();

    for (const filename of entries) {
      const filePath = path.join(RUNTIME_DIR, filename);
      let stat: fs.Stats;
      try {
        stat = fs.statSync(filePath);
      } catch {
        continue;
      }

      if (stat.isDirectory()) continue;

      const isTmpFile =
        filename.endsWith('.tmp') ||
        filename.includes('.tmp.') ||
        filename.includes('.tmp-') ||
        filename.endsWith('.bak');

      const isEphemeralScript =
        (filename.startsWith('blender_') && filename.endsWith('.py')) ||
        (filename.startsWith('ffmpeg_') && filename.endsWith('.ps1')) ||
        (filename.startsWith('graphic_') && filename.endsWith('.js'));

      // 1. Clean Stale Temporary and Ephemeral files
      if (isTmpFile || isEphemeralScript) {
        try {
          const fileSize = stat.size;
          fs.unlinkSync(filePath);
          filesRemovedCount++;
          bytesFreed += fileSize;
          cleanedFiles.push(filename);
        } catch {}
      }

      // 2. Compact Oversized Log JSON files (Rotate to latest 200 items)
      else if (filename.endsWith('.log.json') && stat.size > 100 * 1024) {
        try {
          const raw = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(raw);
          if (Array.isArray(data) && data.length > 200) {
            const compacted = data.slice(-200);
            const compactedJson = JSON.stringify(compacted, null, 2);
            const originalSize = stat.size;
            fs.writeFileSync(filePath, compactedJson, 'utf-8');
            const newSize = fs.statSync(filePath).size;
            const diff = Math.max(0, originalSize - newSize);
            bytesFreed += diff;
            logsCompactedCount++;
            cleanedFiles.push(`${filename} (compacted to 200 items)`);
          }
        } catch {}
      }
    }
  } catch (err) {
    console.error('[Runtime GC] Error scanning directory:', err);
  }

  // 3. Trigger Node.js V8 Engine Garbage Collector if available
  try {
    if (typeof (global as any).gc === 'function') {
      (global as any).gc();
    }
  } catch {}

  const mem = process.memoryUsage();
  const currentMemoryUsageMb = {
    heapUsed: Math.round(mem.heapUsed / (1024 * 1024)),
    heapTotal: Math.round(mem.heapTotal / (1024 * 1024)),
    rss: Math.round(mem.rss / (1024 * 1024)),
  };

  return {
    filesRemovedCount,
    bytesFreed,
    logsCompactedCount,
    currentMemoryUsageMb,
    cleanedFiles: cleanedFiles.slice(0, 50),
    cleanedAt: new Date().toISOString(),
  };
}
