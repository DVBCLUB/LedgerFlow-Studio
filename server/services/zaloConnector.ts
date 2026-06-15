const ZALO_API_BASE = "https://openapi.zalo.me/v3.0";

interface ZaloConfig {
  accessToken: string;
  oaId: string;
}

interface ZaloApiResponse {
  error?: number;
  message?: string;
  data?: Record<string, unknown>;
}

export interface ZaloConnectionResult {
  connected: boolean;
  oaInfo?: {
    id: string;
    name: string;
  };
  error?: string;
}

function getZaloConfig(): ZaloConfig | null {
  const accessToken = process.env.ZALO_OA_ACCESS_TOKEN;
  const oaId = process.env.ZALO_OA_ID;
  if (!accessToken || !oaId) return null;
  return { accessToken, oaId };
}

async function readZaloResponse(response: Response): Promise<ZaloApiResponse> {
  const data = (await response.json().catch(() => ({}))) as ZaloApiResponse;
  if (!response.ok) {
    return { error: response.status, message: data.message || `Zalo API HTTP ${response.status}`, data: data.data };
  }
  return data;
}

function zaloHeaders(config: ZaloConfig): HeadersInit {
  return {
    "Content-Type": "application/json",
    access_token: config.accessToken,
  };
}

export async function testZaloConnection(): Promise<ZaloConnectionResult> {
  const config = getZaloConfig();
  if (!config) {
    return { connected: false, error: "ZALO_OA_ACCESS_TOKEN or ZALO_OA_ID is not configured." };
  }

  try {
    const response = await fetch(`${ZALO_API_BASE}/oa/getoa`, {
      headers: { access_token: config.accessToken },
    });
    const data = await readZaloResponse(response);
    if (data.error && data.error !== 0) {
      return { connected: false, error: data.message || `Zalo API error ${data.error}` };
    }

    const raw = data.data || {};
    return {
      connected: true,
      oaInfo: {
        id: String(raw.oa_id || config.oaId),
        name: String(raw.name || "Zalo Official Account"),
      },
    };
  } catch (error: unknown) {
    return { connected: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getZaloFollowers(offset = 0, count = 50): Promise<{ success: boolean; followers?: unknown[]; total?: number; error?: string }> {
  const config = getZaloConfig();
  if (!config) return { success: false, error: "Zalo OA is not configured." };

  const dataParam = encodeURIComponent(JSON.stringify({ offset, count }));
  const response = await fetch(`${ZALO_API_BASE}/oa/getfollowers?data=${dataParam}`, {
    headers: { access_token: config.accessToken },
  });
  const data = await readZaloResponse(response);
  if (data.error && data.error !== 0) return { success: false, error: data.message || `Zalo API error ${data.error}` };

  const followers = Array.isArray(data.data?.followers) ? data.data.followers : [];
  const total = typeof data.data?.total === "number" ? data.data.total : followers.length;
  return { success: true, followers, total };
}

export async function sendZaloTextMessage(userId: string, text: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const config = getZaloConfig();
  if (!config) return { success: false, error: "Zalo OA is not configured." };

  const response = await fetch(`${ZALO_API_BASE}/oa/message/cs`, {
    method: "POST",
    headers: zaloHeaders(config),
    body: JSON.stringify({
      recipient: { user_id: userId },
      message: { text },
    }),
  });
  const data = await readZaloResponse(response);
  if (data.error && data.error !== 0) return { success: false, error: data.message || `Zalo API error ${data.error}` };

  return {
    success: true,
    messageId: typeof data.data?.message_id === "string" ? data.data.message_id : undefined,
  };
}
