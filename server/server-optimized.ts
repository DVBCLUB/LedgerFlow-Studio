/**
 * LedgerFlow Studio - Optimized Server
 * 
 * This is an optimized version of server.ts with lazy loading
 * to reduce startup time and improve login performance.
 * 
 * Changes from original:
 * - Lazy loading for heavy modules (AI, GitHub, etc.)
 * - Deferred route registration
 * - Only load what's needed for authentication first
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { z } from "zod";

// Load environment variables
dotenv.config();

// ==========================================================================
// LIGHTWEIGHT IMPORTS - Only what's needed for auth and basic operations
// ==========================================================================

// Local Auth - Always needed for login
import { 
  clearLocalSession, 
  createLocalSession, 
  readLocalServerSession, 
  requireLocalAuth, 
  setLocalSessionCookie 
} from "./services/localAuth";
import { loadLocalDatabase, saveLocalDatabase } from "./services/localDatabase";
import { registerAccountingRoutes } from "./services/accountingRoutes";

// Lightweight schemas
const localSessionSchema = z.object({
  email: z.string().email("Email không hợp lệ."),
  password: z.string().min(1, "Mật khẩu không được để trống."),
});
const databaseSaveSchema = z.object({ payload: z.record(z.string(), z.any()) });

// ==========================================================================
// LAZY LOADING - Heavy modules loaded only when needed
// ==========================================================================

// Type definitions for lazy loaded modules
type CallAIOptions = {
  model?: string;
  task?: string;
  [key: string]: any;
};

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

// Lazy load AI Client
let aiClient: {
  callAI: (messages: ChatMessage[], options?: any) => Promise<any>;
  streamAI: (messages: ChatMessage[], options?: any) => any;
  checkAIProxyHealth: () => Promise<any>;
} | null = null;

async function getAIClient() {
  if (!aiClient) {
    const module = await import("./services/aiClient");
    aiClient = {
      callAI: module.callAI,
      streamAI: module.streamAI,
      checkAIProxyHealth: module.checkAIProxyHealth,
    };
  }
  return aiClient;
}

// Lazy load AI Key Vault
let aiKeyVault: {
  createAIKey: (...args: any[]) => Promise<any>;
  deleteAIKey: (...args: any[]) => Promise<any>;
  exportAIKeyBackup: (...args: any[]) => Promise<any>;
  getAIVaultSecurityStatus: () => Promise<any>;
  getSupportedAIProviders: () => any[];
  importAIKeyBackup: (...args: any[]) => Promise<any>;
  listAIKeys: () => Promise<any[]>;
  lockAIVault: () => Promise<any>;
  setupAIVaultPassphrase: (...args: any[]) => Promise<any>;
  unlockAIVault: (...args: any[]) => Promise<any>;
  updateAIKey: (...args: any[]) => Promise<any>;
} | null = null;

async function getAIVault() {
  if (!aiKeyVault) {
    const module = await import("./services/aiKeyVault");
    aiKeyVault = {
      createAIKey: module.createAIKey,
      deleteAIKey: module.deleteAIKey,
      exportAIKeyBackup: module.exportAIKeyBackup,
      getAIVaultSecurityStatus: module.getAIVaultSecurityStatus,
      getSupportedAIProviders: module.getSupportedAIProviders,
      importAIKeyBackup: module.importAIKeyBackup,
      listAIKeys: module.listAIKeys,
      lockAIVault: module.lockAIVault,
      setupAIVaultPassphrase: module.setupAIVaultPassphrase,
      unlockAIVault: module.unlockAIVault,
      updateAIKey: module.updateAIKey,
    };
  }
  return aiKeyVault;
}

// Lazy load AI Router
let aiRouter: {
  diagnoseAIRouter: () => Promise<any>;
  testAIKey: (...args: any[]) => Promise<any>;
} | null = null;

async function getAIRouter() {
  if (!aiRouter) {
    const module = await import("./services/aiRouter");
    aiRouter = {
      diagnoseAIRouter: module.diagnoseAIRouter,
      testAIKey: module.testAIKey,
    };
  }
  return aiRouter;
}

// Lazy load AI Doctor
let aiDoctor: {
  runAIPreflight: () => Promise<any>;
} | null = null;

async function getAIDoctor() {
  if (!aiDoctor) {
    const module = await import("./services/aiDoctor");
    aiDoctor = {
      runAIPreflight: module.runAIPreflight,
    };
  }
  return aiDoctor;
}

// Lazy load AI Usage Log
let aiUsageLog: {
  clearAIUsageLogs: () => Promise<void>;
  readAIUsageLogs: (limit: number) => Promise<any[]>;
} | null = null;

async function getAIUsageLog() {
  if (!aiUsageLog) {
    const module = await import("./services/aiUsageLog");
    aiUsageLog = {
      clearAIUsageLogs: module.clearAIUsageLogs,
      readAIUsageLogs: module.readAIUsageLogs,
    };
  }
  return aiUsageLog;
}

// Lazy load AI Prompt Registry
let aiPromptRegistry: {
  AI_PROMPT_TASKS: readonly string[] | string[];
  activatePromptVersion: (...args: any[]) => Promise<any>;
  createPromptVersion: (...args: any[]) => Promise<any>;
  getActivePrompt: (task: any) => Promise<any>;
  listPromptTemplates: () => Promise<any[]>;
} | null = null;

async function getAIPromptRegistry() {
  if (!aiPromptRegistry) {
    const module = await import("./services/aiPromptRegistry");
    aiPromptRegistry = {
      AI_PROMPT_TASKS: module.AI_PROMPT_TASKS,
      activatePromptVersion: module.activatePromptVersion,
      createPromptVersion: module.createPromptVersion,
      getActivePrompt: module.getActivePrompt,
      listPromptTemplates: module.listPromptTemplates,
    };
  }
  return aiPromptRegistry;
}

// Lazy load AI Vault Auto Lock
let aiVaultAutoLock: {
  disarmAIVaultAutoLock: () => void;
  getAIVaultAutoLockStatus: () => any;
  markAIVaultActivity: () => void;
  updateAIVaultAutoLockConfig: (...args: any[]) => any;
} | null = null;

async function getAIVaultAutoLock() {
  if (!aiVaultAutoLock) {
    const module = await import("./services/aiVaultAutoLock");
    aiVaultAutoLock = {
      disarmAIVaultAutoLock: module.disarmAIVaultAutoLock,
      getAIVaultAutoLockStatus: module.getAIVaultAutoLockStatus,
      markAIVaultActivity: module.markAIVaultActivity,
      updateAIVaultAutoLockConfig: module.updateAIVaultAutoLockConfig,
    };
  }
  return aiVaultAutoLock;
}

// ==========================================================================
// SERVER STARTUP
// ==========================================================================

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const STORAGE_FILE = path.join(process.cwd(), "db_storage.json");

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT ?? 3000);
  const isDev = process.env.NODE_ENV !== "production";
  
  // Security headers
  app.set("trust proxy", 1);
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), clipboard-read=(), clipboard-write=(self)");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    if (req.path.startsWith("/api/")) res.setHeader("Cache-Control", "no-store");

    const originalSetHeader = res.setHeader;
    res.setHeader = function (this: any, name: string, value: any) {
      if (typeof name === "string" && name.toLowerCase() === "content-type" && typeof value === "string") {
        if (
          (value.startsWith("text/") ||
            value.startsWith("application/javascript") ||
            value.startsWith("application/json") ||
            value.startsWith("application/x-javascript")) &&
          !value.toLowerCase().includes("charset")
        ) {
          value = `${value}; charset=utf-8`;
        }
      }
      return originalSetHeader.call(this, name, value);
    } as any;

    next();
  });

  // Body parsers
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  // CORS
  app.use((req, res, next) => {
    const allowedOrigins = ["http://localhost:3000", "http://127.0.0.1:3000", "http://0.0.0.0:3000"];
    const origin = req.headers.origin;
    if (origin) {
      const isAllowed = allowedOrigins.includes(origin as string) || 
        (origin as string).endsWith(".run.app") || 
        /https:\/\/ais-.*\.run\.app/.test(origin as string);
      if (isAllowed) res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    if (req.method === "OPTIONS") res.sendStatus(204);
    else next();
  });

  // Rate limiting for AI endpoints
  const apiLimiter = rateLimit({
    windowMs: 60_000,
    max: isDev ? 240 : 30,
    skip: (req) => isDev && ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.ip || ""),
    message: { error: "Bạn đã đạt giới hạn yêu cầu/phút. Vui lòng thử lại sau.", isRateLimit: true },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false }
  });
  app.use("/api/gemini/", apiLimiter);
  app.use("/api/ai/", apiLimiter);
  app.use("/api/integrations/", apiLimiter);

  // ======================================================================
  // CORE ROUTES - Always available (fast startup)
  // ======================================================================

  // Health check
  app.get("/api/health", (_req, res) => res.json({
    status: "ok",
    desktop: process.env.ELECTRON_DESKTOP === "true",
    time: new Date()
  }));

  // Authentication routes - CRITICAL for login, must be fast
  app.post("/api/auth/local-session", (req, res) => {
    const parsed = localSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues.map((i) => i.message).join(", ") });
    }

    const email = parsed.data.email.trim().toLowerCase();
    let result;
    try {
      result = createLocalSession(email, parsed.data.password);
    } catch (error: any) {
      return res.status(503).json({ success: false, error: error.message || "Local authentication is not configured." });
    }
    if (!result) return res.status(401).json({ success: false, error: "Email hoặc mật khẩu không đúng." });
    setLocalSessionCookie(res, result.token);
    return res.json({
      success: true,
      usesDevPassword: result.usesDevPassword,
      session: result.session,
    });
  });

  app.get("/api/auth/session", (req, res) => {
    const session = readLocalServerSession(req);
    if (!session) return res.status(401).json({ success: false, error: "Authentication required." });
    return res.json({ success: true, session });
  });

  app.post("/api/auth/logout", (req, res) => {
    clearLocalSession(req, res);
    return res.json({ success: true });
  });

  // Database routes
  app.get("/api/db/load", async (_req, res) => {
    try {
      res.json({ success: true, data: await loadLocalDatabase(STORAGE_FILE) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to load database state." });
    }
  });

  app.post("/api/db/save", async (req, res) => {
    try {
      const parsed = databaseSaveSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues.map(i => i.message).join(", ") });
      await saveLocalDatabase(STORAGE_FILE, parsed.data.payload);
      res.json({ success: true, message: "Database synchronized successfully on the server." });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to save database state." });
    }
  });

  // ======================================================================
  // DEFERRED ROUTES - Loaded on demand (lazy)
  // ======================================================================

  // Helper to check if request is for a deferred route
  function isDeferredRoute(path: string): boolean {
    const deferredPaths = [
      "/api/gemini/",
      "/api/ai/",
      "/api/integrations/",
      "/api/contracts",
      "/api/ide/",
    ];
    return deferredPaths.some(p => path.startsWith(p));
  }

  // Deferred route handler - loads modules on first use
  app.use("/api/*", async (req, res, next) => {
    // Skip if already handled by core routes
    if (req.path.startsWith("/api/auth") || req.path.startsWith("/api/db") || req.path.startsWith("/api/health")) {
      return next();
    }

    // Import and register deferred routes on first request
    if (isDeferredRoute(req.path)) {
      try {
        // Dynamic import of routes module
        const { registerDeferredRoutes } = await import("./services/deferredRoutes");
        await registerDeferredRoutes(app);
        return next();
      } catch (err) {
        console.error("Failed to load deferred routes:", err);
        return res.status(500).json({ success: false, error: "Failed to load API routes." });
      }
    }
    
    next();
  });

  // Register accounting routes (important, keep separate)
  app.use("/api", requireLocalAuth);
  registerAccountingRoutes(app);

  // ======================================================================
  // STATIC FILES & SPA FALLBACK
  // ======================================================================

  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (_req, res) => res.sendFile(path.join(process.cwd(), "dist", "index.html")));
  } else {
    // Development mode - use Vite
    const vitePkg = "vi" + "te";
    const { createServer: createViteServer } = await import(vitePkg);
    const vite = await createViteServer({ 
      server: { middlewareMode: true }, 
      appType: "spa" 
    });
    app.use(vite.middlewares);
  }

  // ======================================================================
  // START SERVER
  // ======================================================================

  const host = process.env.HOST || (process.env.ELECTRON_DESKTOP === "true" ? "127.0.0.1" : "0.0.0.0");
  
  return new Promise<void>((resolve) => {
    const server = app.listen(PORT, host, () => {
      console.log(`✅ LedgerFlow server running on http://${host}:${PORT}`);
      console.log(`   - Auth: Ready`);
      console.log(`   - Core API: Ready`);
      console.log(`   - Deferred routes: Will load on demand`);
      resolve();
    });
    
    // Handle server errors
    server.on("error", (error: any) => {
      console.error("❌ Server error:", error);
      process.exit(1);
    });
  });
}

// Start the server
startServer().catch((error) => {
  console.error("❌ Failed to start server", error);
  process.exit(1);
});
