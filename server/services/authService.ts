import type { NextFunction, Request, RequestHandler, Response } from "express";
import { createClient } from "@supabase/supabase-js";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    mode: "supabase" | "local";
  };
}

export function isSupabaseServerAuthConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
}

export async function verifySupabaseToken(token: string) {
  if (!isSupabaseServerAuthConfigured()) return null;

  const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_KEY as string,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) return null;
  return user;
}

export function verifyLocalAdminToken(token: string): boolean {
  const configuredToken = process.env.LOCAL_ADMIN_TOKEN;
  return Boolean(configuredToken && token && token === configuredToken);
}

export const requireAuth: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const user = await verifySupabaseToken(authHeader.slice(7));
    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        mode: "supabase",
      };
      next();
      return;
    }
  }

  const localToken = req.headers["x-local-auth"];
  if (typeof localToken === "string" && verifyLocalAdminToken(localToken)) {
    req.user = {
      id: "local",
      mode: "local",
    };
    next();
    return;
  }

  res.status(401).json({ success: false, error: "Unauthorized" });
};

export const attachOptionalUser: RequestHandler = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const user = await verifySupabaseToken(authHeader.slice(7));
    if (user) {
      req.user = { id: user.id, email: user.email ?? undefined, mode: 'supabase' };
      next();
      return;
    }
  }

  const localToken = req.headers['x-local-auth'];
  if (typeof localToken === 'string' && verifyLocalAdminToken(localToken)) {
    req.user = { id: 'local', mode: 'local' };
  }
  next();
};
