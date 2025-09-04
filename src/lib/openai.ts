// src/lib/openai.ts
export type Role = "user" | "assistant" | "system";
export type ChatMsg = { role: Role; content: string };

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string;
const API_URL = import.meta.env.VITE_OPENAI_API_URL as string;

if (!API_KEY) {
  throw new Error("Missing VITE_OPENAI_API_KEY in environment variables");
}
if (!API_URL) {
  throw new Error("Missing VITE_OPENAI_API_URL in environment variables");
}

export async function askStream(
  messages: ChatMsg[],
  onDelta: (textChunk: string) => void,
  model = "gpt-4o-mini",
  signal?: AbortSignal
) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: messages,
      stream: true,
    }),
    signal,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error: ${err}`);
  }

  const reader = res.body?.getReader();

  const decoder = new TextDecoder();

  if (!reader) return;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") continue;

      try {
        const evt = JSON.parse(jsonStr);
        if (evt.type === "response.output_text.delta" && evt.delta) {
          onDelta(evt.delta);
        }
      } catch {
        // ignore parse errors for keep-alive/heartbeats
      }
    }
  }
}
