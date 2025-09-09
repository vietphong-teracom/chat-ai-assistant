import { useRef, useState, useEffect } from "react";
import { ChatMsg, UploadedFile } from "@/types";
import { askGPT } from "@/lib/GPT";

export function useChat() {
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { role: "system", content: "Bạn là trợ lý hữu ích, trả lời ngắn gọn, rõ ràng." },
  ]);
  const [streaming, setStreaming] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [inputValue, setInputValue] = useState("");

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const sendStream = async () => {
    if ((!inputValue.trim() && files.length === 0) || streaming) return;

    // 1. Gộp file vào message user
    const newUserMessage: ChatMsg = {
      role: "user",
      content: inputValue,
      files: files.map((f) => ({
        name: f.name,
        type: f.type,
        fileId: f.fileId!,
        previewUrl: f.previewUrl,
        size: f.size,
        uploading: f.uploading ?? false,
      })),
    };

    const nextMsgs = [...msgs, newUserMessage];
    setMsgs(nextMsgs);

    // Reset input và files
    setInputValue("");
    setFiles([]);
    setStreaming(true);

    // 2. Tạo AbortController
    const controller = new AbortController();
    abortRef.current = controller;

    // 3. Thêm message assistant trống để stream dữ liệu về
    setMsgs((prev) => [...prev, { role: "assistant", content: "" }]);

    // 4. Callback append delta trực tiếp vào state
    const onDelta = (delta: string) => {
      setMsgs((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.role === "assistant") {
          copy[copy.length - 1] = { ...last, content: last.content + delta };
        }
        return copy;
      });
    };

    try {
      await askGPT(nextMsgs, onDelta, files, "gpt-5", controller.signal);
    } finally {
      // 6. Reset trạng thái streaming
      setStreaming(false);
      abortRef.current = null;
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  return { msgs, setMsgs, streaming, files, setFiles, inputValue, setInputValue, sendStream, scrollRef };
}
