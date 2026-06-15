// @ts-nocheck
import type { Express } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { callAI } from './aiClient';
import { createReferralCode, getReferralStats, trackReferralEvent } from './affiliateService';
import { getAgentRole } from './agentRoles';
import { getFacebookPageInsights, prepareFacebookPost, testFacebookConnection } from './facebookConnector';
import { importMISAWorkbook } from './misaBridge';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const agentExecuteSchema = z.object({ taskId: z.string().optional(), agentRole: z.string().default('AI Dev'), prompt: z.string().min(1), context: z.record(z.string(), z.unknown()).optional().default({}) });
const referralCodeSchema = z.object({ userId: z.string().uuid(), partnerName: z.string().min(2), partnerEmail: z.string().email().optional().or(z.literal('')).default(''), partnerType: z.string().default('Kế toán dịch vụ'), commissionRate: z.coerce.number().min(0).max(50).default(20), commissionType: z.enum(['one_time', 'recurring']).default('recurring') });
const referralEventSchema = z.object({ code: z.string().min(1), eventType: z.enum(['click', 'signup', 'trial', 'paid', 'churned']), customerEmail: z.string().email().optional(), productName: z.string().optional(), revenueVND: z.coerce.number().optional().default(0), metadata: z.record(z.string(), z.unknown()).optional().default({}) });

export function registerBrief3Routes(app: Express) {
  app.get('/api/integrations/facebook/test', async (_req, res) => res.json(await testFacebookConnection()));
  app.get('/api/integrations/facebook/insights', async (_req, res) => res.json(await getFacebookPageInsights()));
  app.post('/api/integrations/facebook/post', async (req, res) => {
    const parsed = z.object({ message: z.string().min(1), link: z.string().url().optional().or(z.literal('')).default('') }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map((i) => i.message).join(', ') });
    res.json(await prepareFacebookPost(parsed.data.message, parsed.data.link || undefined));
  });

  app.post('/api/accounting/misa-import', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ success: false, error: 'Chưa upload file' });
      res.json(importMISAWorkbook(req.file.buffer));
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.post('/api/agents/execute', async (req, res) => {
    try {
      const parsed = agentExecuteSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map((i) => i.message).join(', ') });
      const role = getAgentRole(parsed.data.agentRole);
      const output = await callAI([
        { role: 'system', content: role?.systemPrompt || 'You are a LedgerFlow AI agent.' },
        { role: 'user', content: `${parsed.data.prompt}\n\nContext:\n${JSON.stringify(parsed.data.context, null, 2)}` },
      ], { model: 'ai-assistant' });
      res.json({ success: true, taskId: parsed.data.taskId || `agent-${Date.now()}`, output: output.content || output.text || '' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Agent execution failed.' });
    }
  });

  app.get('/api/affiliate/track', async (req, res) => {
    try {
      const parsed = z.object({ code: z.string().min(1), event: z.string().default('click') }).safeParse(req.query);
      if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map((i) => i.message).join(', ') });
      await trackReferralEvent(parsed.data.code, parsed.data.event, { ipAddress: req.ip });
      res.json({ success: true, code: parsed.data.code });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.post('/api/affiliate/codes', async (req, res) => {
    try {
      const parsed = referralCodeSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map((i) => i.message).join(', ') });
      const { userId, partnerName, partnerEmail, partnerType, commissionRate, commissionType } = parsed.data;
      res.json({ success: true, code: await createReferralCode(userId, partnerName, partnerEmail, partnerType, commissionRate, commissionType) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.get('/api/affiliate/stats', async (req, res) => {
    try {
      const parsed = z.object({ userId: z.string().uuid() }).safeParse(req.query);
      if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map((i) => i.message).join(', ') });
      res.json({ success: true, ...(await getReferralStats(parsed.data.userId)) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.post('/api/affiliate/events', async (req, res) => {
    try {
      const parsed = referralEventSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map((i) => i.message).join(', ') });
      const { code, eventType, ...details } = parsed.data;
      res.json({ success: true, event: await trackReferralEvent(code, eventType, { ...details, ipAddress: req.ip }) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });
}
