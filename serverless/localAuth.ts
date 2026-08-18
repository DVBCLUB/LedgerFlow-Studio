import { createHmac, timingSafeEqual } from "crypto";

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
export const SESSION_COOKIE = "ledgerflow_session";
export type LocalRole = "owner" | "operator" | "viewer" | "automation";

export type LocalSession = {
  email: string;
  role: LocalRole;
  loggedInAt: string;
};

type SignedSessionPayload = LocalSession & {
  expiresAt: number;
};

function firstNonEmptyEnv(names: string[]): string | null {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return null;
}

function sameSecret(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function sessionSecret(): string {
  const explicit = firstNonEmptyEnv(["LOCAL_AUTH_SESSION_SECRET", "LEDGERFLOW_SESSION_SECRET", "JWT_SECRET"]);
  if (explicit) return explicit;

  const fallback = firstNonEmptyEnv(["LOCAL_AUTH_DEV_PASSWORD", "LOCAL_AUTH_PASSWORD", "ADMIN_PASSWORD"]);
  if (fallback) return fallback;

  return "ledgerflow-hosted-auth-session-secret-bootstrap-key";
}

function configuredPassword(): { password: string; usesDevPassword: boolean } {
  const explicit = firstNonEmptyEnv(["LOCAL_AUTH_DEV_PASSWORD", "LOCAL_AUTH_PASSWORD", "ADMIN_PASSWORD"]);
  if (explicit) return { password: explicit, usesDevPassword: false };

  return { password: "admin123", usesDevPassword: true };
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

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(header.split(";").map((part) => {
    const separator = part.indexOf("=");
    if (separator < 0) return [part.trim(), ""];
    return [part.slice(0, separator).trim(), decodeURIComponent(part.slice(separator + 1))];
  }));
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

export function createLocalSession(email: string, password: string) {
  const auth = configuredPassword();
  if (!sameSecret(password, auth.password)) return null;

  const ownerEmail = (firstNonEmptyEnv(["LOCAL_AUTH_OWNER_EMAIL", "LOCAL_AUTH_EMAIL", "ADMIN_EMAIL"]) || "").toLowerCase();
  if (ownerEmail && email.trim().toLowerCase() !== ownerEmail) return null;

  const stored: SignedSessionPayload = {
    email,
    role: "owner",
    loggedInAt: new Date().toISOString(),
    expiresAt: Date.now() + SESSION_TTL_MS,
  };

  return {
    token: createSignedToken(stored),
    session: { email: stored.email, role: stored.role, loggedInAt: stored.loggedInAt },
    usesDevPassword: auth.usesDevPassword,
    maxAgeSeconds: SESSION_TTL_MS / 1000,
  };
}

export function readLocalServerSession(cookieHeader: string | undefined): LocalSession | null {
  const token = parseCookies(cookieHeader)[SESSION_COOKIE];
  if (!token) return null;

  const signed = readSignedToken(token);
  if (!signed) return null;
  return { email: signed.email, role: signed.role, loggedInAt: signed.loggedInAt };
}

export function sessionCookieValue(token: string, maxAgeSeconds: number): string {
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

export function expiredSessionCookieValue(): string {
  return sessionCookieValue("", 0);
}

export function noStore(res: { setHeader: (name: string, value: string) => void }) {
  res.setHeader("Cache-Control", "no-store");
}

export function methodNotAllowed(res: { setHeader: (name: string, value: string) => void; status: (code: number) => { json: (payload: unknown) => void } }, method: string) {
  res.setHeader("Allow", method);
  return res.status(405).json({ success: false, error: `Method not allowed. Use ${method}.` });
}

export function parseJsonBody(req: { body?: unknown }): Record<string, unknown> {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof req.body === "object") return req.body as Record<string, unknown>;
  return {};
}
