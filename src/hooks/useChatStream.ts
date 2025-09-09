// src/hooks/useChatStream.ts
import type { ChatMsg, UploadedFile } from "@/types";
import { askGPT } from "@/lib/GPT";

interface UseChatStreamProps {
  msgs: ChatMsg[];
  setMsgs: React.Dispatch<React.SetStateAction<ChatMsg[]>>;
  files: UploadedFile[];
  setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  streaming: boolean;
  setStreaming: React.Dispatch<React.SetStateAction<boolean>>;
  abortRef: React.MutableRefObject<AbortController | null>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useChatStream({
  msgs,
  setMsgs,
  files,
  setFiles,
  inputValue,
  setInputValue,
  streaming,
  setStreaming,
  abortRef,
  setError,
}: UseChatStreamProps) {
  const sendMessage = async () => {
    if ((!inputValue.trim() && files.length === 0) || streaming) return;

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

    // Reset input + file list
    setInputValue("");
    setFiles([]);
    setStreaming(true);
    setError(null);

    // Tạo AbortController
    const controller = new AbortController();
    abortRef.current = controller;

    // Thêm message rỗng của assistant để append stream
    setMsgs((prev) => [...prev, { role: "assistant", content: "" }]);

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
      await askGPT(nextMsgs, onDelta, files, controller.signal);
    } catch (err: any) {
      console.error("Chat stream error:", err);
      setError(err.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  return { sendMessage };
}
