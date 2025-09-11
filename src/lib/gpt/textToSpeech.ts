const API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string;
const API_URL = import.meta.env.VITE_OPENAI_API_URL as string;

if (!API_KEY) {
  throw new Error("Missing VITE_OPENAI_API_KEY in environment variables");
}
if (!API_URL) {
  throw new Error("Missing VITE_OPENAI_API_URL in environment variables");
}
export async function generateTTS(text: string, signal?: AbortSignal): Promise<string> {
  const body = {
    model: "gpt-4o-mini-tts",
    voice: "alloy",
    input: text,
  };

  const res = await fetch(`${API_URL}/audio/speech`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    let errMsg = `Request failed: ${res.status}`;
    try {
      const errJson = await res.json();
      errMsg = errJson.error?.message || JSON.stringify(errJson);
    } catch {
      errMsg = await res.text();
    }
    throw new Error(`OpenAI TTS error: ${errMsg}`);
  }

  const blob = await res.blob();
  const audioBlob = new Blob([blob], { type: "audio/mpeg" });

  const url = URL.createObjectURL(audioBlob);
  return url;
}
