import {
  createLocalSession,
  methodNotAllowed,
  noStore,
  parseJsonBody,
  sessionCookieValue,
} from "../../serverless/localAuth";

export default function handler(req: any, res: any) {
  noStore(res);

  if (req.method !== "POST") {
    return methodNotAllowed(res, "POST");
  }

  const body = parseJsonBody(req);
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !email.includes("@")) {
    return res.status(400).json({ success: false, error: "Email không hợp lệ." });
  }

  if (!password) {
    return res.status(400).json({ success: false, error: "Mật khẩu không được để trống." });
  }

  try {
    const result = createLocalSession(email, password);
    if (!result) {
      return res.status(401).json({ success: false, error: "Email hoặc mật khẩu không đúng." });
    }

    res.setHeader("Set-Cookie", sessionCookieValue(result.token, result.maxAgeSeconds));
    return res.status(200).json({
      success: true,
      usesDevPassword: result.usesDevPassword,
      session: result.session,
    });
  } catch (error: any) {
    return res.status(503).json({
      success: false,
      error: error?.message || "Local authentication is not configured.",
    });
  }
}
