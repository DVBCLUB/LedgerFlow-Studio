import {
  expiredSessionCookieValue,
  methodNotAllowed,
  noStore,
} from "../../serverless/localAuth";

export default function handler(req: any, res: any) {
  noStore(res);

  if (req.method !== "POST") {
    return methodNotAllowed(res, "POST");
  }

  res.setHeader("Set-Cookie", expiredSessionCookieValue());
  return res.status(200).json({ success: true });
}
