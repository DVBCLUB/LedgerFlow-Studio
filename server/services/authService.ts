import { createClient, type User } from "@supabase/supabase-js";
import type { NextFunction, Request, Response } from "express";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";

export interface AuthenticatedRequest extends Request {
  user?: User;
  authMode?: "supabase" | "local";
}

export async function verifySupabaseToken(token: string): Promise<User | null> {
  if (!supabaseUrl || !supabaseServiceKey) return null;

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) return null;
  return user;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const supabaseConfigured = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);

  if (!supabaseConfigured) {
    const localToken = req.headers["x-local-auth"];
    const expectedLocalToken = process.env.LOCAL_ADMIN_TOKEN;

    if (expectedLocalToken && localToken === expectedLocalToken) {
      req.authMode = "local";
      return next();
    }

    return res.status(401).json({ error: "Unauthorized" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }

  const token = authHeader.slice(7);
  verifySupabaseToken(token)
    .then((user) => {
      if (!user) return res.status(401).json({ error: "Invalid token" });
      req.user = user;
      req.authMode = "supabase";
      return next();
    })
    .catch(() => res.status(401).json({ error: "Invalid token" }));
}
