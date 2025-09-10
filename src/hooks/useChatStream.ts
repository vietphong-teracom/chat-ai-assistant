// src/hooks/useChatStream.ts
import type { ChatMsg, UploadedFile } from "@/types";
import { askGPT, generateTTS } from "@/lib/GPT";
import { fetchTopArticlesText } from "@/lib/fetchRss";
import { useEffect } from "react";

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

/** Mặc định map nguồn sang RSS (mở rộng nếu cần) */
const KNOWN_FEEDS: Record<string, string> = {
  vnexpress: "https://vnexpress.net/rss/tin-moi-nhat.rss",
  thanhnien: "https://thanhnien.vn/rss/home.rss",
  laodong: "https://laodong.vn/rss/home.rss",
};

/** sendMessage: send theo inputValue + files (chat bình thường) */

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
    const isMicOn = localStorage.getItem("isMicOn") === "true";

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

    setMsgs((prev) => [
      ...prev,
      newUserMessage,
      { role: "assistant", content: "" }, // placeholder assistant
    ]);

    // Reset input + files
    setInputValue("");
    setFiles([]);
    setStreaming(true);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      let assistantText = "";

      if (isMicOn && files.length === 0) {
        const audioUrl = await generateTTS(
          newUserMessage.content,
          controller.signal
        );

        setMsgs((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant") {
            const updated = { ...last, audioUrl };

            copy[copy.length - 1] = updated;
          }
          return copy;
        });
      } else {
        // Các trường hợp còn lại → call GPT streaming
        const onDelta = (delta: string) => {
          assistantText += delta;
          setMsgs((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last?.role === "assistant") {
              copy[copy.length - 1] = {
                ...last,
                content: last.content + delta,
              };
            }
            return copy;
          });
        };

        await askGPT(
          [...msgs, newUserMessage],
          onDelta,
          files,
          controller.signal
        );

        if (isMicOn) {
          // Sau khi GPT xong → tạo TTS từ kết quả
          const audioUrl = await generateTTS(assistantText, controller.signal);

          setMsgs((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last?.role === "assistant") {
              copy[copy.length - 1] = { ...last, audioUrl };
            }
            return copy;
          });
        }
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      setError(err.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  async function sendNewsSummary(
    providedMsgs: ChatMsg[],
    feedKey = "vnexpress"
  ) {
    if (streaming) return;
    setError(null);

    const feedUrl = KNOWN_FEEDS[feedKey] ?? KNOWN_FEEDS["vnexpress"];
    const controller = new AbortController();
    abortRef.current = controller;

    // Validate last user message exists
    const lastMsg = providedMsgs[providedMsgs.length - 1];
    if (!lastMsg || lastMsg.role !== "user") {
      setError("Internal: expected last message to be user message");
      return;
    }

    setStreaming(true);

    // Add a temporary assistant message to show progress
    setMsgs((prev) => [
      ...prev,
      { role: "assistant", content: "Đang lấy tin từ nguồn..." },
    ]);

    try {
      // 1) fetch feed as text (top N articles)
      const feedText = await fetchTopArticlesText(
        feedUrl,
        5,
        controller.signal
      );

      // 2) construct final user content (we do NOT show the full feedText in UI to keep it clean)
      const finalUserContent = `Nguồn: ${feedUrl}\n\n${feedText}\n\nYêu cầu: ${lastMsg.content}`;

      // 3) prepare messages for API: replace last user message with enriched content
      const msgsForApi: ChatMsg[] = [
        ...providedMsgs.slice(0, -1),
        { ...lastMsg, content: finalUserContent },
      ];

      // remove temporary assistant progress message we just appended
      setMsgs((prev) => prev.slice(0, Math.max(0, prev.length - 1)));

      // append assistant placeholder (empty) for streaming results
      setMsgs((prev) => [...prev, { role: "assistant", content: "" }]);

      // callback to append deltas to last assistant message
      const onDelta = (delta: string) => {
        setMsgs((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant") {
            copy[copy.length - 1] = {
              ...last,
              content: (last.content || "") + delta,
            };
          }
          return copy;
        });
      };

      // 4) call the GPT streaming API
      await askGPT(msgsForApi, onDelta, [], controller.signal);
      setError(null);
    } catch (err: any) {
      if (err?.name === "AbortError") setError("Đã hủy truy vấn.");
      else setError(err?.message ?? "Lỗi khi lấy/tóm tắt tin tức");
      console.error("sendNewsSummary error:", err);

      // remove the temporary assistant entry if it exists
      setMsgs((prev) => prev.slice(0, Math.max(0, prev.length - 1)));
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  return { sendMessage, sendNewsSummary };
}
