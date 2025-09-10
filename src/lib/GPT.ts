import { ChatMsg, InputContent, UploadedFile } from "@/types";

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string;
const API_URL = import.meta.env.VITE_OPENAI_API_URL as string;

if (!API_KEY) {
  throw new Error("Missing VITE_OPENAI_API_KEY in environment variables");
}
if (!API_URL) {
  throw new Error("Missing VITE_OPENAI_API_URL in environment variables");
}
const SYSTEM_RULES = `
Bạn là một trợ lý AI với các nguyên tắc bắt buộc:

1. Ngôn ngữ và phong cách
   - Luôn trả lời bằng tiếng Việt chuẩn, rõ ràng, mạch lạc, dễ hiểu.
   - Không sử dụng từ tục tĩu, từ suồng sã, hay ngôn ngữ chat lóng.
   - Giữ giọng điệu lịch sự, trang trọng, nhất quán trong toàn bộ cuộc hội thoại.

2. Phong cách học thuật / bối cảnh
   - Khi trả lời về sự kiện lịch sử, nhân vật, bối cảnh, phải chuẩn xác, rõ ràng.
   - Giải thích phải có bối cảnh và logic mạch lạc.
`;

/**
 * Build input messages theo định dạng API yêu cầu
 */
function buildInput(messages: ChatMsg[], files: UploadedFile[]) {
  return messages
    .filter((m) => m.role === "user" || m.role === "system")
    .map((msg) => {
      const content: InputContent[] = [
        { type: "input_text", text: msg.content },
      ];

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
async function fetchChatResponse(
  body: object,
  signal?: AbortSignal
): Promise<Response> {
  const res = await fetch(`${API_URL}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal,
  });

  // if (!res.ok) {
  //   const errText = await res.text();
  //   throw new Error(`OpenAI API error: ${errText}`);
  // }
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
async function handleStream(res: Response, onDelta: (delta: string) => void) {
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
          onDelta(evt.delta);
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
  onDelta: (delta: string) => void,
  files: UploadedFile[] = [],
  signal?: AbortSignal
) {
  const input = [
    { role: "system", content: SYSTEM_RULES },
    ...buildInput(messages, files),
  ];
  const body = {
    model: "gpt-5",
    input,
    stream: true,
  };

  const res = await fetchChatResponse(body, signal);

  await handleStream(res, onDelta);
}
export async function generateTTS(
  text: string,
  signal?: AbortSignal
): Promise<string> {
  // trả về URL thay vì blob
  const body = {
    model: "gpt-4o-mini-tts",
    voice: "alloy", // hoặc các voice khác nếu có
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

  const blob = await res.blob(); // blob MP3

  const url = URL.createObjectURL(blob);

  // tạo object URL để UI dùng
  return url;
}

/**
 * Chơi audio nếu muốn (tuỳ chọn)
 */
export function playTTS(blobOrUrl: Blob | string) {
  const url =
    typeof blobOrUrl === "string" ? blobOrUrl : URL.createObjectURL(blobOrUrl);
  const audio = new Audio(url);
  audio.play();
}
