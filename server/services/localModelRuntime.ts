/**
 * localModelRuntime.ts
 * ============================================================
 * Kiểm tra trạng thái Ollama (AI local) qua HTTP API chính thống.
 * Không nặng RAM: chỉ gọi GET /api/tags để liệt kê model đã tải.
 */

export interface LocalModelStatus {
  running: boolean;
  models: string[];
  error?: string;
}

export async function listLocalModels(): Promise<LocalModelStatus> {
  try {
    const res = await fetch('http://127.0.0.1:11434/api/tags', { signal: AbortSignal.timeout(2000) });
    if (!res.ok) return { running: false, models: [] };
    const data = (await res.json()) as { models?: Array<{ name: string }> };
    return { running: true, models: (data.models || []).map((m) => m.name) };
  } catch (err) {
    return { running: false, models: [], error: err instanceof Error ? err.message : String(err) };
  }
}

export interface LocalModelResult {
  ok: boolean;
  model?: string;
  content?: string;
  error?: string;
}

/**
 * Gọi model local qua Ollama HTTP API (localhost:11434).
 * Dùng /api/chat, stream=false, có timeout 120s.
 */
export async function callLocalModel(input: {
  prompt: string;
  system?: string;
  model?: string;
}): Promise<LocalModelResult> {
  try {
    const res = await fetch('http://127.0.0.1:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: input.model || 'qwen2.5-coder:7b',
        messages: [
          ...(input.system ? [{ role: 'system', content: input.system }] : []),
          { role: 'user', content: input.prompt },
        ],
        stream: false,
      }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) return { ok: false, error: `Ollama HTTP ${res.status}` };
    const data = (await res.json()) as { message?: { content?: string }; model?: string };
    return { ok: true, model: data.model, content: data.message?.content || '' };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
