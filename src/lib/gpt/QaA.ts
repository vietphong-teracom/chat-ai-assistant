import { ChatMsg, InputContent, UploadedFile } from "@/types";

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string;
const API_URL = import.meta.env.VITE_OPENAI_API_URL as string;

if (!API_KEY) {
  throw new Error("Missing VITE_OPENAI_API_KEY in environment variables");
}
if (!API_URL) {
  throw new Error("Missing VITE_OPENAI_API_URL in environment variables");
}

/**
 * Build input messages theo định dạng API yêu cầu
 */
function buildInput(messages: ChatMsg[], files: UploadedFile[]) {
  return messages
    .filter((m) => m.role === "user" || m.role === "system")
    .map((msg) => {
      const content: InputContent[] = [{ type: "input_text", text: msg.content }];

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
}

/**
 * Gửi request lên API
 */
async function fetchChatResponse(body: object, signal?: AbortSignal): Promise<Response> {
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
    let errMsg = `Request failed: ${res.status}`;
    try {
      const errJson = await res.json();
      errMsg = errJson.error?.message || JSON.stringify(errJson);
    } catch {
      errMsg = await res.text();
    }
    throw new Error(`OpenAI API error: ${errMsg}`);
  }

  return res;
}

/**
 * Xử lý stream dữ liệu từ API, parse JSON từng dòng, gọi callback với delta text
 */
async function handleStream(res: Response, appendData: (delta: string) => void) {
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
        if (evt.type === "response.output_text.delta" && evt.delta) {
          appendData(evt.delta);
        }
      } catch (err) {
        console.warn("Failed to parse delta:", err);
      }
    }
  }
}

/**
 * Hàm chính gọi API GPT và stream dữ liệu về
 */
export async function askGPT(
  messages: ChatMsg[],
  appendData: (delta: string) => void,
  files: UploadedFile[] = [],
  signal?: AbortSignal
) {
  const input = buildInput(messages, files);

  const body = {
    model: "gpt-5",
    input,
    stream: true,
  };

  const res = await fetchChatResponse(body, signal);

  await handleStream(res, appendData);
}
