// src/hooks/useChatStream.ts
import type { ChatMsg, UploadedFile } from "@/types";
import { askGPT, generateTTS } from "@/lib/GPT";
import {
  fetchRssAsJson,
  fetchRssAsText,
  fetchTopArticlesText,
} from "@/lib/fetchRss";

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

/** Mặc định map nguồn sang RSS */
const KNOWN_FEEDS: Record<string, string> = {
  vnexpress: "https://vnexpress.net/rss/tin-moi-nhat.rss",
  thanhnien: "https://thanhnien.vn/rss/home.rss",
  laodong: "https://laodong.vn/rss/home.rss",
};

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
  const sendMessage = async (): Promise<string | null> => {
    console.log("message", msgs);
    if ((!inputValue.trim() && files.length === 0) || streaming) return null;

    const ttsEnabled = localStorage.getItem("ttsEnabled") === "true";

    // Nếu mic bật → chỉ tạo TTS, trả về Blob
    if (ttsEnabled) {
      try {
        const controller = new AbortController();
        abortRef.current = controller;
        const mp3Url = await generateTTS(inputValue, controller.signal);
        return mp3Url; // trả blob, UI sẽ xử lý render audio
      } catch (err: any) {
        console.error("TTS error:", err);
        setError(err?.message || "Có lỗi TTS");
        return null;
      } finally {
        abortRef.current = null;
        setInputValue("");
        setFiles([]);
      }
    }

    // Nếu TTS tắt → hoạt động bình thường với GPT
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
    setInputValue("");
    setFiles([]);
    setStreaming(true);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

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

      if (ttsEnabled) {
        try {
          const controller = new AbortController();
          abortRef.current = controller;

          const mp3Url = await generateTTS(inputValue, controller.signal);

          // Push luôn message user kèm audioUrl
          const ttsMessage: ChatMsg = {
            role: "assistant",
            content: inputValue,
            audioUrl: mp3Url,
            files: [],
          };
          setMsgs((prev) => [...prev, ttsMessage]);

          setInputValue("");
          setFiles([]);
          return mp3Url;
        } catch (err: any) {
          console.error("TTS error:", err);
          setError(err?.message || "Có lỗi TTS");
          return null;
        } finally {
          abortRef.current = null;
        }
      }

      return null;
    } catch (err: any) {
      console.error("Chat stream error:", err);
      setError(err?.message || "Có lỗi xảy ra, vui lòng thử lại.");
      return null;
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
      const msgsForApi = [
        ...providedMsgs.slice(0, -1),
        { ...lastMsg, content: finalUserContent },
      ];

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
