import { randomBytes, timingSafeEqual } from "crypto";
import type { NextFunction, Request, Response } from "express";
import { getLocalAuthSetupError, readConfiguredLocalAuthPassword } from "./authService.ts";

const SESSION_COOKIE = "ledgerflow_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
export type LocalRole = "owner" | "operator" | "viewer" | "automation";
const sessions = new Map<string, { email: string; role: LocalRole; loggedInAt: string; expiresAt: number }>();

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

function configuredPassword(): { password: string; usesDevPassword: boolean } | null {
  return readConfiguredLocalAuthPassword();
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

export function createLocalSession(email: string, password: string) {
  const auth = configuredPassword();
  if (!auth) throw new Error(getLocalAuthSetupError());
  if (!sameSecret(password, auth.password)) return null;
  const token = randomBytes(32).toString("base64url");
  const stored = { email, role: "owner" as const, loggedInAt: new Date().toISOString(), expiresAt: Date.now() + SESSION_TTL_MS };
  sessions.set(token, stored);
  return {
    token,
    session: { email: stored.email, role: stored.role, loggedInAt: stored.loggedInAt },
    usesDevPassword: auth.usesDevPassword,
  };
}

export function setLocalSessionCookie(res: Response, token: string) {
  res.setHeader("Set-Cookie", cookieValue(token, SESSION_TTL_MS / 1000));
}

export function clearLocalSession(req: Request, res: Response) {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (token) sessions.delete(token);
  res.setHeader("Set-Cookie", cookieValue("", 0));
}

export function readLocalServerSession(req: Request) {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (!token) return null;
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
