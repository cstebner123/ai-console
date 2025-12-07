// src/api.ts

export interface StreamChunk {
  text: string;
  isThinking: boolean;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

export async function* streamQuery(
  prompt: string,
  model?: string
): AsyncGenerator<StreamChunk> {
  const body: any = { prompt };
  if (model) body.model = model;

  const resp = await fetch(`${API_BASE_URL}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok || !resp.body) {
    const text = await resp.text().catch(() => "");
    throw new Error(`HTTP ${resp.status}: ${text}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder("utf-8");

  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      let obj: any;
      try {
        obj = JSON.parse(trimmed);
      } catch {
        // not JSON, just treat as normal answer text
        yield { text: trimmed, isThinking: false };
        continue;
      }

      // gpt-oss style: thinking + response
      const thinking =
        typeof obj.thinking === "string" ? obj.thinking : "";
      const response =
        typeof obj.response === "string"
          ? obj.response
          : typeof obj.content === "string"
          ? obj.content
          : "";

      if (thinking) {
        yield { text: thinking, isThinking: true };
      }

      if (response) {
        yield { text: response, isThinking: false };
      }

      // ignore chunks that are only { done: true } etc.
    }
  }

  const leftover = buffer.trim();
  if (leftover) {
    try {
      const obj = JSON.parse(leftover);
      const thinking =
        typeof obj.thinking === "string" ? obj.thinking : "";
      const response =
        typeof obj.response === "string"
          ? obj.response
          : typeof obj.content === "string"
          ? obj.content
          : "";

      if (thinking) {
        yield { text: thinking, isThinking: true };
      }
      if (response) {
        yield { text: response, isThinking: false };
      }
    } catch {
      yield { text: leftover, isThinking: false };
    }
  }
}