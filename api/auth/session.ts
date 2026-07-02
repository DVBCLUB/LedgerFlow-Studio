import { methodNotAllowed, noStore, readLocalServerSession } from "../../serverless/localAuth";

export default function handler(req: any, res: any) {
  noStore(res);

  if (req.method !== "GET") {
    return methodNotAllowed(res, "GET");
  }

  const session = readLocalServerSession(req.headers?.cookie);
  if (!session) {
    return res.status(401).json({ success: false, error: "Chưa đăng nhập." });
  }

  return res.status(200).json({ success: true, session });
}
