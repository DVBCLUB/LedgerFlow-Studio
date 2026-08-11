/**
 * zeroTrustPoisonShield.ts
 * ============================================================
 * Zero-Trust Context Poisoning & Prompt Injection Defense Engine for LedgerFlow OS.
 *
 * Scans untrusted external input (Web Scraping, PDF Invoices, Email, External Webhooks)
 * for malicious patterns:
 *  - Prompt Injection & Roleplay Bypasses ("Ignore previous instructions", "DAN mode")
 *  - System Prompt Exfiltration ("Output your system prompt", "Show API vault")
 *  - Malicious Script & Command Injection (`eval()`, `exec()`, `rm -rf`)
 *  - Data Exfiltration Patterns
 *
 * Neutralizes and sanitizes content before forwarding to LLM agents.
 */

import { appendAuditEvent } from './auditLog.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ContextInputSource = 'web_scrape' | 'pdf_invoice' | 'email' | 'webhook' | 'user_input';

export interface ContextPoisonScanRequest {
  rawContent: string;
  source?: ContextInputSource;
}

export interface ContextPoisonScanResult {
  isPoisoned: boolean;
  threatScore: number; // 0.0 (safe) to 1.0 (dangerous)
  detectedPatterns: string[];
  sanitizedContent: string;
  actionTaken: 'passed' | 'sanitized' | 'blocked';
  scannedAt: string;
}

// ─── Threat Pattern Matrix ────────────────────────────────────────────────────

interface ThreatPattern {
  id: string;
  category: 'prompt_injection' | 'system_exfiltration' | 'script_injection' | 'data_exfiltration';
  pattern: RegExp;
  weight: number;
  description: string;
}

const THREAT_PATTERNS: ThreatPattern[] = [
  // Prompt Injection & Roleplay Bypass (weight: 0.4 - 0.6)
  { id: 'pi_ignore_instructions', category: 'prompt_injection', pattern: /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|directives|prompts)/i, weight: 0.6, description: 'Attempt to override previous system instructions.' },
  { id: 'pi_jailbreak_dan', category: 'prompt_injection', pattern: /\b(do\s+anything\s+now|dan\s+mode|jailbreak|unfiltered\s+ai)\b/i, weight: 0.5, description: 'Attempt to activate jailbreak or DAN mode.' },
  { id: 'pi_roleplay_bypass', category: 'prompt_injection', pattern: /you\s+are\s+now\s+(an?\s+)?unrestricted\s+(ai|assistant|system)/i, weight: 0.5, description: 'Roleplay bypass prompt injection.' },
  { id: 'pi_system_override', category: 'prompt_injection', pattern: /\[system\s+override\]|<system_instructions>/i, weight: 0.5, description: 'Fake system delimiter injection.' },

  // System Prompt Exfiltration (weight: 0.4 - 0.5)
  { id: 'ex_output_system_prompt', category: 'system_exfiltration', pattern: /(print|output|display|show|reveal|repeat)\s+(your\s+)?(full\s+)?system\s+(prompt|instructions|directive)/i, weight: 0.5, description: 'Attempt to exfiltrate system prompt.' },
  { id: 'ex_show_api_keys', category: 'system_exfiltration', pattern: /(print|show|reveal|get)\s+(the\s+)?(api|vault|secret)\s+key/i, weight: 0.5, description: 'Attempt to leak API keys or secrets.' },

  // Malicious Script & Command Injection (weight: 0.5 - 0.7)
  { id: 'sc_html_script', category: 'script_injection', pattern: /<script[\s\S]*?>[\s\S]*?<\/script>/i, weight: 0.5, description: 'Embedded HTML script tag.' },
  { id: 'sc_eval_exec', category: 'script_injection', pattern: /\b(eval\(|exec\(|child_process|process\.env)\b/i, weight: 0.5, description: 'Dangerous JS eval or process execution.' },
  { id: 'sc_shell_rm', category: 'script_injection', pattern: /\b(rm\s+-rf|drop\s+table|format\s+c:)\b/i, weight: 0.7, description: 'Destructive shell or SQL command.' },

  // Data Exfiltration Patterns (weight: 0.5 - 0.6)
  { id: 'df_send_external', category: 'data_exfiltration', pattern: /(send|post|exfiltrate|fetch)\s+.*?\s+(to|at)\s+https?:\/\//i, weight: 0.5, description: 'Instruction to post internal data to external URL.' },
];

// ─── Core Scan & Cleanse Engine ───────────────────────────────────────────────

/**
 * Scans untrusted input for context poisoning and sanitizes dangerous injection patterns.
 */
export async function scanAndCleanseContextPrompt(
  request: ContextPoisonScanRequest
): Promise<ContextPoisonScanResult> {
  const content = request.rawContent || '';
  const source = request.source || 'user_input';
  const detectedPatterns: string[] = [];
  let threatScore = 0;

  // Scan against Threat Pattern Matrix
  for (const item of THREAT_PATTERNS) {
    if (item.pattern.test(content)) {
      detectedPatterns.push(`${item.category}:${item.id} (${item.description})`);
      threatScore += item.weight;
    }
  }

  // Cap threat score at 1.0
  threatScore = Math.min(1.0, Math.round(threatScore * 100) / 100);
  const isPoisoned = threatScore >= 0.20;

  let actionTaken: ContextPoisonScanResult['actionTaken'] = 'passed';
  let sanitizedContent = content;

  if (threatScore >= 0.70) {
    actionTaken = 'blocked';
    sanitizedContent = '[BLOCKED: Threat score exceeds security threshold (0.70). High-risk prompt injection detected.]';
  } else if (threatScore >= 0.20) {
    actionTaken = 'sanitized';
    // Neutralize injection patterns by stripping script tags and wrapping in safe markdown fence
    let cleansed = content;
    cleansed = cleansed.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '[SCRIPT_REMOVED]');
    cleansed = cleansed.replace(/ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|directives|prompts)/gi, '[INJECTION_NEUTRALIZED]');
    cleansed = cleansed.replace(/\b(rm\s+-rf|drop\s+table|format\s+c:)\b/gi, '[DESTRUCTIVE_CMD_NEUTRALIZED]');
    sanitizedContent = `[UNTRUSTED_CONTENT_SOURCE: ${source.toUpperCase()}]\n\`\`\`text\n${cleansed}\n\`\`\``;
  }

  if (isPoisoned) {
    await appendAuditEvent({
      actor: 'poison-shield',
      workspace: 'Security',
      action: 'poison_shield.threat_detected',
      target: source,
      risk: threatScore >= 0.70 ? 'HIGH' : 'MEDIUM',
      status: actionTaken === 'blocked' ? 'failed' : 'executed',
      summary: `Threat score ${threatScore} (${actionTaken}) for content source ${source}. Detected: ${detectedPatterns.length} patterns.`,
      evidence: { threatScore, actionTaken, source, patterns: detectedPatterns },
    }).catch(() => undefined);
  }

  return {
    isPoisoned,
    threatScore,
    detectedPatterns,
    sanitizedContent,
    actionTaken,
    scannedAt: new Date().toISOString(),
  };
}
