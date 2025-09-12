const API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string;
const API_URL = import.meta.env.VITE_OPENAI_API_URL as string;

if (!API_KEY) {
  throw new Error('Missing VITE_OPENAI_API_KEY in environment variables');
}
if (!API_URL) {
  throw new Error('Missing VITE_OPENAI_API_URL in environment variables');
}

/**
 * Convert Speech to Text using OpenAI Whisper
 * @param audioFile - File âm thanh từ micro hoặc file upload
 */
export async function generateSTT(audioFile: File, signal?: AbortSignal): Promise<string> {
  const formData = new FormData();
  formData.append('file', audioFile);
  formData.append('model', 'whisper-1'); // Model Speech-to-Text của OpenAI
  formData.append('language', 'vi'); // Nếu muốn chỉ định tiếng Việt, có thể bỏ nếu muốn auto detect

  const res = await fetch(`${API_URL}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
    body: formData,
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
    throw new Error(`OpenAI STT error: ${errMsg}`);
  }

  const data = await res.json();
  return data.text; // Văn bản sau khi chuyển đổi từ giọng nói
}
