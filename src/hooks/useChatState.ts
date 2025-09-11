import { useRef, useState, useEffect } from "react";
import type { ChatMsg, UploadedFile } from "@/types";

export function useChatState() {
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { role: "system", content: "Bạn là trợ lý hữu ích, trả lời ngắn gọn, rõ ràng." },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Tự động scroll xuống cuối khi có message mới
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  return {
    msgs,
    setMsgs,
    inputValue,
    setInputValue,
    files,
    setFiles,
    streaming,
    setStreaming,
    error,
    setError,
    abortRef,
    scrollRef,
  };
}
