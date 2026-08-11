import { createHash, randomBytes } from "crypto";

export type WebAIDataRisk = "LOW" | "HIGH" | "BLOCKED";
export type WebAIDataFindingType = "private_key" | "api_key" | "credential" | "email" | "phone" | "payment_card";

export interface WebAIDataFinding {
  type: WebAIDataFindingType;
  severity: "sensitive" | "secret";
  count: number;
}

export interface WebAIExecutionPreview {
  id: string;
  fingerprint: string;
  platform: string;
  profileId?: string;
  promptChars: number;
  redactedPreview: string;
  findings: WebAIDataFinding[];
  risk: WebAIDataRisk;
  blocked: boolean;
  requiresApproval: boolean;
  expiresAt: string;
}

interface StoredPreview extends WebAIExecutionPreview {
  prompt: string;
}

interface StoredApproval {
  token: string;
  previewId: string;
  fingerprint: string;
  expiresAt: number;
}

const PREVIEW_TTL_MS = 15 * 60 * 1000; // 15 minutes — browser automation can take 2-5 min, leave buffer
const APPROVAL_TTL_MS = 2 * 60 * 1000;
const previews = new Map<string, StoredPreview>();
const approvals = new Map<string, StoredApproval>();

const RULES: Array<{
  type: WebAIDataFindingType;
  severity: "sensitive" | "secret";
  pattern: RegExp;
}> = [
  { type: "private_key", severity: "secret", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { type: "api_key", severity: "secret", pattern: /\b(?:sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AIza[A-Za-z0-9_-]{20,})\b/g },
  { type: "credential", severity: "secret", pattern: /\b(?:password|passwd|passphrase|client_secret|api_key|access_token)\s*[:=]\s*["']?[^\s"']{8,}/gi },
  { type: "email", severity: "sensitive", pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { type: "phone", severity: "sensitive", pattern: /(?<!\d)(?:\+?84|0)(?:\s?\d){9,10}(?!\d)/g },
  { type: "payment_card", severity: "sensitive", pattern: /\b(?:\d[ -]*?){13,19}\b/g },
];

function cleanupExpired(): void {
  const now = Date.now();
  for (const [id, preview] of previews) {
    if (Date.parse(preview.expiresAt) <= now) previews.delete(id);
  }
  for (const [token, approval] of approvals) {
    if (approval.expiresAt <= now) approvals.delete(token);
  }
}

export function fingerprintWebAIRequest(prompt: string, platform: string, profileId?: string): string {
  return createHash("sha256").update(`${platform.trim().toLowerCase()}\0${profileId || ""}\0${prompt}`).digest("hex");
}

export function inspectWebAIData(prompt: string): { findings: WebAIDataFinding[]; redacted: string; risk: WebAIDataRisk } {
  const findings: WebAIDataFinding[] = [];
  let redacted = prompt;
  for (const rule of RULES) {
    const matches = Array.from(prompt.matchAll(new RegExp(rule.pattern.source, rule.pattern.flags)));
    if (matches.length === 0) continue;
    findings.push({ type: rule.type, severity: rule.severity, count: matches.length });
    redacted = redacted.replace(new RegExp(rule.pattern.source, rule.pattern.flags), `[REDACTED:${rule.type}]`);
  }
  const risk: WebAIDataRisk = findings.some((finding) => finding.severity === "secret")
    ? "BLOCKED"
    : findings.length > 0 ? "HIGH" : "LOW";
  return { findings, redacted, risk };
}

export function createWebAIExecutionPreview(input: { prompt: string; platform: string; profileId?: string }): WebAIExecutionPreview {
  cleanupExpired();
  const inspection = inspectWebAIData(input.prompt);
  const id = `web_preview_${Date.now()}_${randomBytes(6).toString("hex")}`;
  const expiresAt = new Date(Date.now() + PREVIEW_TTL_MS).toISOString();
  const preview: StoredPreview = {
    id,
    fingerprint: fingerprintWebAIRequest(input.prompt, input.platform, input.profileId),
    platform: input.platform.trim().toLowerCase(),
    profileId: input.profileId,
    promptChars: input.prompt.length,
    redactedPreview: inspection.redacted.slice(0, 1200),
    findings: inspection.findings,
    risk: inspection.risk,
    blocked: inspection.risk === "BLOCKED",
    requiresApproval: inspection.risk === "HIGH",
    expiresAt,
    prompt: input.prompt,
  };
  previews.set(id, preview);
  const { prompt: _prompt, ...publicPreview } = preview;
  return publicPreview;
}

export function approveWebAIExecution(previewId: string, fingerprint: string): { approvalToken: string; expiresAt: string } {
  cleanupExpired();
  const preview = previews.get(previewId);
  if (!preview || preview.fingerprint !== fingerprint) throw new Error("Web AI preview is missing, expired, or changed.");
  if (preview.blocked) throw new Error("Secrets cannot be approved for Web AI transmission.");
  const token = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + APPROVAL_TTL_MS;
  approvals.set(token, { token, previewId, fingerprint, expiresAt });
  return { approvalToken: token, expiresAt: new Date(expiresAt).toISOString() };
}

export function consumeWebAIExecution(input: {
  previewId: string;
  prompt: string;
  platform: string;
  profileId?: string;
  approvalToken?: string;
}): WebAIExecutionPreview {
  cleanupExpired();
  const preview = previews.get(input.previewId);
  if (!preview) throw new Error("Web AI preview is required or has expired.");
  const fingerprint = fingerprintWebAIRequest(input.prompt, input.platform, input.profileId);
  if (preview.fingerprint !== fingerprint) throw new Error("Web AI request changed after preview. Create a new preview.");
  if (preview.blocked) throw new Error("Web AI request contains a secret and is blocked.");
  if (preview.requiresApproval) {
    const approval = input.approvalToken ? approvals.get(input.approvalToken) : undefined;
    if (!approval || approval.previewId !== preview.id || approval.fingerprint !== fingerprint) {
      throw new Error("A valid one-time approval token is required for sensitive Web AI data.");
    }
    approvals.delete(approval.token);
  }
  previews.delete(preview.id);
  const { prompt: _prompt, ...publicPreview } = preview;
  return publicPreview;
}
