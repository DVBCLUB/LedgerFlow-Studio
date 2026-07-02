function hasAnyEnv(names: string[]) {
  return names.some((name) => Boolean(process.env[name]?.trim()));
}

export default function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ success: false, error: "Method not allowed. Use GET." });
  }

  return res.status(200).json({
    success: true,
    runtime: {
      nodeEnv: process.env.NODE_ENV || null,
      vercel: Boolean(process.env.VERCEL),
      vercelEnv: process.env.VERCEL_ENV || null,
    },
    auth: {
      hasOwnerEmail: hasAnyEnv(["LOCAL_AUTH_OWNER_EMAIL", "LOCAL_AUTH_EMAIL", "ADMIN_EMAIL"]),
      hasPassword: hasAnyEnv(["LOCAL_AUTH_DEV_PASSWORD", "LOCAL_AUTH_PASSWORD", "ADMIN_PASSWORD"]),
      hasSessionSecret: hasAnyEnv(["LOCAL_AUTH_SESSION_SECRET", "LEDGERFLOW_SESSION_SECRET", "JWT_SECRET"]),
      supportedOwnerEmailKeys: ["LOCAL_AUTH_OWNER_EMAIL", "LOCAL_AUTH_EMAIL", "ADMIN_EMAIL"],
      supportedPasswordKeys: ["LOCAL_AUTH_DEV_PASSWORD", "LOCAL_AUTH_PASSWORD", "ADMIN_PASSWORD"],
      supportedSessionSecretKeys: ["LOCAL_AUTH_SESSION_SECRET", "LEDGERFLOW_SESSION_SECRET", "JWT_SECRET"],
    },
  });
}
