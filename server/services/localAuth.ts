import { createHmac, timingSafeEqual } from "crypto";
import type { NextFunction, Request, Response } from "express";
import { verifyUser, listUsers } from './userAccounts.ts';

const SESSION_COOKIE = "ledgerflow_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
export type LocalRole = "owner" | "operator" | "viewer" | "automation";
const sessions = new Map<string, { email: string; role: LocalRole; loggedInAt: string; expiresAt: number }>();
const revokedTokens = new Map<string, number>();

type SignedSessionPayload = {
  email: string;
  role: LocalRole;
  loggedInAt: string;
  expiresAt: number;
};

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(header.split(";").map((part) => {
    const separator = part.indexOf("=");
    if (separator < 0) return [part.trim(), ""];
    return [part.slice(0, separator).trim(), decodeURIComponent(part.slice(separator + 1))];
  }));
}

function sameSecret(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function firstNonEmptyEnv(names: string[]): string | null {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return null;
}

function sessionSecret(): string {
  const explicit = firstNonEmptyEnv(["LOCAL_AUTH_SESSION_SECRET", "LEDGERFLOW_SESSION_SECRET", "JWT_SECRET"]);
  if (explicit) return explicit;
  const fallback = firstNonEmptyEnv(["LOCAL_AUTH_DEV_PASSWORD", "LOCAL_AUTH_PASSWORD", "ADMIN_PASSWORD"]);
  if (fallback) return fallback;
  return "ledgerflow-hosted-auth-session-secret-bootstrap-key";
}

function signSessionPayload(payloadBase64Url: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadBase64Url).digest("base64url");
}

function createSignedToken(payload: SignedSessionPayload): string {
  const secret = sessionSecret();
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = signSessionPayload(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

function readSignedToken(token: string): SignedSessionPayload | null {
  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;

  const encodedPayload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!encodedPayload || !signature) return null;

  try {
    const secret = sessionSecret();
    const expected = signSessionPayload(encodedPayload, secret);
    if (!sameSecret(signature, expected)) return null;

    const parsed = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as SignedSessionPayload;
    if (!parsed?.email || !parsed?.loggedInAt || !parsed?.role || typeof parsed.expiresAt !== "number") return null;
    if (parsed.expiresAt <= Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function pruneRevokedTokens() {
  const now = Date.now();
  for (const [token, expiresAt] of revokedTokens) {
    if (expiresAt <= now) revokedTokens.delete(token);
  }
}

function configuredPassword(): { password: string; usesDevPassword: boolean } {
  const explicit = firstNonEmptyEnv(["LOCAL_AUTH_DEV_PASSWORD", "LOCAL_AUTH_PASSWORD", "ADMIN_PASSWORD"]);
  if (explicit) return { password: explicit, usesDevPassword: false };
  return { password: "admin123", usesDevPassword: true };
}

function cookieValue(token: string, maxAgeSeconds: number): string {
  const secure = process.env.NODE_ENV === "production" && process.env.ELECTRON_DESKTOP !== "true";
  return [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${maxAgeSeconds}`,
    secure ? "Secure" : "",
  ].filter(Boolean).join("; ");
}

function issueSession(email: string, role: LocalRole, usesDevPassword: boolean) {
  const stored = { email, role, loggedInAt: new Date().toISOString(), expiresAt: Date.now() + SESSION_TTL_MS };
  const token = createSignedToken(stored);
  sessions.set(token, stored);
  return {
    token,
    session: { email: stored.email, role: stored.role, loggedInAt: stored.loggedInAt },
    usesDevPassword,
  };
}

export function createLocalSession(email: string, password: string) {
  const auth = configuredPassword();
  const cleanEmail = email.trim().toLowerCase();

  // 1) Đa người dùng: email khớp tài khoản local → xác thực bằng mật khẩu riêng.
  const localRole = verifyUser(cleanEmail, password);
  if (localRole) return issueSession(cleanEmail, localRole, false);

  // 2) Chưa có tài khoản owner → giữ bootstrap bằng mật khẩu dev chung (chống tự khóa).
  const hasOwner = listUsers().some((u) => u.role === 'owner');
  if (!hasOwner) {
    if (sameSecret(password, auth.password)) {
      const ownerEmail = (firstNonEmptyEnv(["LOCAL_AUTH_OWNER_EMAIL", "LOCAL_AUTH_EMAIL", "ADMIN_EMAIL"]) || "").toLowerCase();
      if (!ownerEmail || cleanEmail === ownerEmail) {
        return issueSession(cleanEmail, "owner", auth.usesDevPassword);
      }
    }
  }

  // 3) Đã có tài khoản owner → mật khẩu dev chung không còn được dùng.
  return null;
}

export function setLocalSessionCookie(res: Response, token: string) {
  res.setHeader("Set-Cookie", cookieValue(token, SESSION_TTL_MS / 1000));
}

export function clearLocalSession(req: Request, res: Response) {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (token) {
    const signed = readSignedToken(token);
    if (signed) revokedTokens.set(token, signed.expiresAt);
    sessions.delete(token);
  }
  res.setHeader("Set-Cookie", cookieValue("", 0));
}

export function readLocalServerSession(req: Request) {
  pruneRevokedTokens();
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (!token) return null;
  if (revokedTokens.has(token)) return null;

  const signed = readSignedToken(token);
  if (signed) return { email: signed.email, role: signed.role, loggedInAt: signed.loggedInAt };

  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  return { email: session.email, role: session.role, loggedInAt: session.loggedInAt };
}

export function readRequestPrincipal(req: Request): { id: string; role: LocalRole } | null {
  const session = readLocalServerSession(req);
  if (session) return { id: session.email, role: session.role };
  const configuredToken = process.env.LEDGERFLOW_API_TOKEN;
  const bearer = req.headers.authorization?.replace(/^Bearer\s+/i, "") || "";
  if (configuredToken && bearer && sameSecret(bearer, configuredToken)) return { id: "api-token", role: "automation" };
  return null;
}

export function requireRoles(...roles: LocalRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const principal = readRequestPrincipal(req);
    if (principal && roles.includes(principal.role)) return next();
    return res.status(403).json({ success: false, error: `Role required: ${roles.join(", ")}.` });
  };
}

export function requireLocalAuth(req: Request, res: Response, next: NextFunction) {
  if (readRequestPrincipal(req)) return next();
  return res.status(401).json({ success: false, error: "Authentication required." });
}
