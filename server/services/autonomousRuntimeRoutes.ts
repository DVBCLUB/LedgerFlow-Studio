/**
 * autonomousRuntimeRoutes.ts
 * ═══════════════════════════════════════════════════════════════
 * Route HTTP cho Autonomous Runtime — chỉ đọc trạng thái heartbeat.
 * ═══════════════════════════════════════════════════════════════
 */

import type { Express } from 'express';
import { startAutonomousRuntime, getAutonomousRuntimeStatus } from './autonomousRuntime.ts';

export function registerAutonomousRuntimeRoutes(app: Express): void {
  startAutonomousRuntime();

  app.get('/api/autonomous/status', (_req, res) => {
    res.json({ success: true, ...getAutonomousRuntimeStatus() });
  });
}
