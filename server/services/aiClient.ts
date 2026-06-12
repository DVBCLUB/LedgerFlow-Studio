/**
 * aiClient.ts
 * ============================================================
 * Client gọi tới LiteLLM proxy chạy local (127.0.0.1:4000).
 * Thay thế cho việc gọi trực tiếp Gemini API.
 *
 * LiteLLM tự lo việc:
 *   - Chọn provider còn quota (Gemini -> Groq -> OpenRouter -> Ollama local)
 *   - Retry & fallback khi gặp 429 / lỗi
 *
 * Yêu cầu .env của app có:
 *   AI_PROXY_URL=http://127.0.0.1:4000
 *   AI_PROXY_KEY=sk-ledgerflow-local-2026
 * ============================================================
 */

const AI_PROXY_URL = process.env.AI_PROXY_URL ?? "http://127.0.0.1:4000";
const AI_PROXY_KEY = process.env.AI_PROXY_KEY ?? "sk-ledgerflow-local-2026";

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface CallAIOptions {
  /** "ai-assistant" (mặc định, free tier rotation) hoặc "ai-assistant-pro" */
  model?: "ai-assistant" | "ai-assistant-pro";
  temperature?: number;
  maxTokens?: number;
}

export interface CallAIResult {
  content: string;
  /** Provider/model thực tế đã trả lời (LiteLLM trả về trong response) */
  modelUsed?: string;
  raw: unknown;
}

class AIProxyError extends Error {
  constructor(message: string, public status?: number, public body?: unknown) {
    super(message);
    this.name = "AIProxyError";
  }
}

/**
 * Gọi AI, trả về kết quả đầy đủ (không streaming).
 * Dùng cho: phân loại giao dịch, audit suggestions, các task ngắn.
 */
export async function callAI(
  messages: ChatMessage[],
  options: CallAIOptions = {}
): Promise<CallAIResult> {
  const { model = "ai-assistant", temperature = 0.7, maxTokens } = options;

  const response = await fetch(`${AI_PROXY_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_PROXY_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    }),
  });

  if (!response.ok) {
    const body = await safeReadJson(response);
    throw new AIProxyError(
      `AI proxy returned ${response.status}`,
      response.status,
      body
    );
  }

  const data = (await response.json()) as {
    model?: string;
    choices: { message: { content: string } }[];
  };

  const content = data.choices?.[0]?.message?.content ?? "";

  return {
    content,
    modelUsed: data.model,
    raw: data,
  };
}

/**
 * Gọi AI với streaming — trả về AsyncGenerator phát từng chunk text.
 * Dùng cho: chat UI trong LedgerFlow Studio (trải nghiệm giống ChatGPT/Claude).
 *
 * Cách dùng trong route Express:
 *
 *   app.post("/api/chat/stream", async (req, res) => {
 *     res.setHeader("Content-Type", "text/event-stream");
 *     res.setHeader("Cache-Control", "no-cache");
 *     res.setHeader("Connection", "keep-alive");
 *
 *     try {
 *       for await (const chunk of streamAI(req.body.messages)) {
 *         res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
 *       }
 *     } catch (err) {
 *       res.write(`data: ${JSON.stringify({ error: String(err) })}\n\n`);
 *     } finally {
 *       res.write("data: [DONE]\n\n");
 *       res.end();
 *     }
 *   });
 */
export async function* streamAI(
  messages: ChatMessage[],
  options: CallAIOptions = {}
): AsyncGenerator<string, void, unknown> {
  const { model = "ai-assistant", temperature = 0.7, maxTokens } = options;

  const response = await fetch(`${AI_PROXY_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_PROXY_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    const body = await safeReadJson(response);
    throw new AIProxyError(
      `AI proxy stream returned ${response.status}`,
      response.status,
      body
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      // Giữ lại phần cuối (có thể chưa hoàn chỉnh) cho lần đọc tiếp theo
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;

        const payload = trimmed.slice("data:".length).trim();
        if (payload === "[DONE]") return;

        try {
          const json = JSON.parse(payload);
          const delta: string | undefined = json.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          // Bỏ qua các dòng không parse được (keep-alive comments, v.v.)
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Kiểm tra proxy có đang chạy không — gọi lúc app khởi động để
 * cảnh báo sớm nếu quên chạy `litellm --config ...`
 */
export async function checkAIProxyHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${AI_PROXY_URL}/health`, {
      headers: { Authorization: `Bearer ${AI_PROXY_KEY}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function safeReadJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
