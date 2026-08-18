/**
 * testAppHelper.ts
 * ============================================================
 * Helper to bootstrap a test Express app and run live HTTP tests via fetch.
 */

import express from 'express';
import type { Server } from 'http';
import type { AddressInfo } from 'net';
import { registerAgentLoopRoutes } from '../agentLoopRoutes.ts';
import { registerGovernanceSecurityRoutes } from '../governanceSecurityRoutes.ts';
import { registerRobotAutomationRoutes } from '../robotAutomationRoutes.ts';
import { registerAiWorkforceRoutes } from '../aiWorkforceRoutes.ts';
import { registerConnectorIntegrationRoutes } from '../connectorIntegrationRoutes.ts';
import { registerMediaContentRoutes } from '../mediaContentRoutes.ts';
import { registerRevenueCommerceRoutes } from '../revenueCommerceRoutes.ts';
import { registerPrivacyComplianceRoutes } from '../privacyComplianceRoutes.ts';

export function createTestApp() {
  const app = express();
  app.use(express.json());

  registerAgentLoopRoutes(app);
  registerGovernanceSecurityRoutes(app);
  registerRobotAutomationRoutes(app);
  registerAiWorkforceRoutes(app);
  registerConnectorIntegrationRoutes(app);
  registerMediaContentRoutes(app);
  registerRevenueCommerceRoutes(app);
  registerPrivacyComplianceRoutes(app);

  return app;
}

export async function withTestServer(fn: (baseUrl: string) => Promise<void>): Promise<void> {
  const app = createTestApp();
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });

  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await fn(baseUrl);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}
