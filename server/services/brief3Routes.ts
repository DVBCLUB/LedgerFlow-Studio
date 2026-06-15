// @ts-nocheck
import type { Express } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { callAI } from './aiClient';
import { getAgentRole } from './agentRoles';
import { importMISAWorkbook } from './misaBridge';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const agentExecuteSchema = z.object({ taskId: z.string().optional(), agentRole: z.string().default('AI Dev'), prompt: z.string().min(1), context: z.record(z.string(), z.unknown()).optional().default({}) });

export function registerBrief3Routes(app: Express) {
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
}
