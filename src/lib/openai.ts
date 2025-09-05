// src/lib/openai.ts
export type Role = "user" | "assistant" | "system";

export type ChatMsg = {
  role: Role;
  content: string;
  files?: UploadedFile[]; // Thêm thuộc tính files tùy chọn
};

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  fileId?: string; // id từ OpenAI trả về
  previewUrl?: string; // để hiển thị ảnh hoặc file blob trước khi gửi
  uploading: boolean; // trạng thái đang upload
}

export const API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string;
export const API_URL = import.meta.env.VITE_OPENAI_API_URL as string;

if (!API_KEY) {
  throw new Error("Missing VITE_OPENAI_API_KEY in environment variables");
}
if (!API_URL) {
  throw new Error("Missing VITE_OPENAI_API_URL in environment variables");
}
// src/lib/openai.ts
export async function askStreamUnified(
  messages: ChatMsg[],
  onDelta: (delta: string) => void,
  files: UploadedFile[] = [],
  model = "gpt-4o-mini",
  signal?: AbortSignal
) {
  // Chỉ gửi user + system message, bỏ qua assistant
  const input = messages
    .filter((m) => m.role === "user" || m.role === "system")
    .map((msg) => {
      const content: any[] = [{ type: "input_text", text: msg.content }];

      // Nếu là user và có file, append file_id
      if (msg.role === "user" && files.length > 0) {
        files.forEach((f) => {
          if (f.fileId) {
            content.push({ type: "input_file", file_id: f.fileId });
          }
        });
      }

      return {
        role: msg.role,
        content,
      };
    });

  const body: any = {
    model,
    input,
    stream: true,
  };

  const res = await fetch(`${API_URL}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API error: ${errText}`);
  }

  if (!res.body) return;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

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

        // delta streaming text từ assistant
        if (evt.type === "response.output_text.delta" && evt.delta) {
          onDelta(evt.delta);
        }
      } catch (err) {
        console.warn("Failed to parse delta:", err);
      }
    }
  }
}
