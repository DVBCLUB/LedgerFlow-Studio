/**
 * privacyComplianceRoutes.ts
 * ============================================================
 * Privacy Masking, Competitor Radar & Ollama Local Hub Endpoints.
 */

import type { Express, Request, Response } from 'express';
import { maskSensitiveData, unmaskSensitiveData, auditPrivacyCompliance } from './vietnameseDataPrivacyMasker.ts';
import { processVoiceCallTurn } from './ceoVoiceInteractiveBridge.ts';
import { scanCompetitorLandscape, generateCompetitiveBattleCard } from './competitorRadarScanner.ts';
import { checkOllamaLocalStatus, listCuratedLocalModels } from './ollamaLocalHubService.ts';

const param = (value: string | string[]) => (Array.isArray(value) ? value[0] ?? '' : value);

export function registerPrivacyComplianceRoutes(app: Express): void {
  // ─── VIETNAMESE DATA PRIVACY MASKER (Nghị định 13/2023/NĐ-CP) ───
  app.post('/api/privacy/mask', (req: Request, res: Response) => {
    const { text } = req.body || {};
    if (!text) return res.status(400).json({ success: false, error: 'text is required' });
    const result = maskSensitiveData(text);
    res.json({ success: true, ...result });
  });

  app.post('/api/privacy/unmask', (req: Request, res: Response) => {
    const { maskedText, tokensMap } = req.body || {};
    if (!maskedText || !tokensMap) {
      return res.status(400).json({ success: false, error: 'maskedText and tokensMap are required' });
    }
    const unmaskedText = unmaskSensitiveData(maskedText, tokensMap);
    res.json({ success: true, unmaskedText });
  });

  app.post('/api/privacy/audit', (req: Request, res: Response) => {
    const { text } = req.body || {};
    if (!text) return res.status(400).json({ success: false, error: 'text is required' });
    const audit = auditPrivacyCompliance(text);
    res.json({ success: true, audit });
  });

  // ─── CEO INTERACTIVE VOICE CALL & SPEECH ENGINE ───
  app.post('/api/voice/call/turn', (req: Request, res: Response) => {
    const { speakerRole, spokenUserText } = req.body || {};
    if (!spokenUserText) {
      return res.status(400).json({ success: false, error: 'spokenUserText is required' });
    }
    const turn = processVoiceCallTurn({
      speakerRole: speakerRole || 'role_chief_of_staff',
      spokenUserText,
    });
    res.json({ success: true, turn });
  });

  // ─── AUTONOMOUS COMPETITOR FEATURE & PRICE RADAR ───
  app.get('/api/radar/competitors', (_req: Request, res: Response) => {
    res.json({ success: true, radar: scanCompetitorLandscape() });
  });

  app.get('/api/radar/battle-card/:id', (req: Request, res: Response) => {
    const battleCard = generateCompetitiveBattleCard(param(req.params.id));
    res.json({ success: true, battleCard });
  });

  // ─── 1-CLICK OLLAMA LOCAL MODEL HUB ───
  app.get('/api/ollama/local/status', async (_req: Request, res: Response) => {
    const status = await checkOllamaLocalStatus();
    res.json({ success: true, status });
  });

  app.get('/api/ollama/local/models', (_req: Request, res: Response) => {
    res.json({ success: true, models: listCuratedLocalModels() });
  });
}
