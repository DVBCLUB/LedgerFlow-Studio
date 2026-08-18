/**
 * agentSystemRoutes.ts
 * ============================================================
 * Central Orchestrator for all Agent System Sub-Routers.
 * 
 * Clean Modular Monolith Architecture (8 Decoupled Domain Sub-Routers):
 *  1. agentLoopRoutes.ts           - Agentic loops, circuit breaker, performance, auto-repair
 *  2. governanceSecurityRoutes.ts  - SOP runbooks, RBAC delegation, approvals, incidents, probation
 *  3. robotAutomationRoutes.ts     - Software robots, multi-platform swarm, digital twin, cron
 *  4. aiWorkforceRoutes.ts         - Workforce cockpit, AI staff registry, shifts, tasks, mailbox
 *  5. connectorIntegrationRoutes.ts - System events, telemetry, MCP server, Edge LLM, Nexus, CRM scout
 *  6. mediaContentRoutes.ts        - Product campaigns, Gemini Live voice, TTS, video pipelines, avatar
 *  7. revenueCommerceRoutes.ts     - SaaS pricing optimization, synthetic feedback, executive boardroom
 *  8. privacyComplianceRoutes.ts   - Vietnamese PII masker (NĐ 13/2023), competitor radar, Ollama hub
 */

import type { Express } from 'express';
import { registerAgentLoopRoutes } from './agentLoopRoutes.ts';
import { registerGovernanceSecurityRoutes } from './governanceSecurityRoutes.ts';
import { registerRobotAutomationRoutes } from './robotAutomationRoutes.ts';
import { registerAiWorkforceRoutes } from './aiWorkforceRoutes.ts';
import { registerConnectorIntegrationRoutes } from './connectorIntegrationRoutes.ts';
import { registerMediaContentRoutes } from './mediaContentRoutes.ts';
import { registerRevenueCommerceRoutes } from './revenueCommerceRoutes.ts';
import { registerPrivacyComplianceRoutes } from './privacyComplianceRoutes.ts';

export function registerAgentSystemRoutes(app: Express): void {
  registerAgentLoopRoutes(app);
  registerGovernanceSecurityRoutes(app);
  registerRobotAutomationRoutes(app);
  registerAiWorkforceRoutes(app);
  registerConnectorIntegrationRoutes(app);
  registerMediaContentRoutes(app);
  registerRevenueCommerceRoutes(app);
  registerPrivacyComplianceRoutes(app);

  console.log('✅ Agent system routes registered (8 decoupled domain sub-routers active)');
}
