// src/hooks/useChatStream.ts
import type { ChatMsg, UploadedFile } from "@/types";
import { askGPT } from "@/lib/GPT";
import { fetchRssAsJson, fetchRssAsText } from "@/lib/fetchRss";

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

  async function sendNewsSummary(providedMsgs: ChatMsg[], feedKey = "vnexpress") {
    if (streaming) return;
    setError(null);

    const feedUrl = KNOWN_FEEDS[feedKey] ?? KNOWN_FEEDS["vnexpress"];
    const controller = new AbortController();
    abortRef.current = controller;

    // Lấy last user message (caller phải pass providedMsgs có chứa user message ở cuối)
    const lastMsg = providedMsgs[providedMsgs.length - 1];
    if (!lastMsg || lastMsg.role !== "user") {
      setError("Internal: expected last message to be user message");
      return;
    }

    // 1) Fetch RSS
    setStreaming(true);
    try {
      // optional: show a temporary assistant message (đang lấy nguồn)
      setMsgs((prev) => [...prev, { role: "assistant", content: "Đang lấy tin từ nguồn..." }]);

      const feedText = await fetchRssAsText(feedUrl, 5, controller.signal);

      // 2) Gộp content để gửi tới API (NHƯNG không update UI với content dài)
      const finalUserContent = `Nguồn: ${feedUrl}\n\n${feedText}\n\nYêu cầu: ${lastMsg.content}`;

      // Chuẩn bị messages sẽ gửi tới API: thay thế last user message bằng finalUserContent
      const msgsForApi = [...providedMsgs.slice(0, -1), { ...lastMsg, content: finalUserContent }];

      // Remove the temporary "Đang lấy tin..." assistant message we just added
      setMsgs((prev) => prev.slice(0, Math.max(0, prev.length - 1)));

      // 3) Append assistant placeholder for streaming in UI
      setMsgs((prev) => [...prev, { role: "assistant", content: "" }]);

      const onDelta = (delta: string) => {
        setMsgs((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant") {
            copy[copy.length - 1] = { ...last, content: (last.content || "") + delta };
          }
          return copy;
        });
      };

      // 4) Call askGPT with msgsForApi (user content enriched)
      await askGPT(msgsForApi, onDelta, [], controller.signal);
      setError(null);
    } catch (err: any) {
      if (err.name === "AbortError") {
        setError("Đã hủy truy vấn.");
      } else {
        setError(err?.message ?? "Lỗi khi lấy/tóm tắt tin tức");
      }
      console.error("sendNewsSummary error:", err);
      // Remove the temporary assistant entry if exists
      setMsgs((prev) => prev.slice(0, Math.max(0, prev.length - 1)));
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  async function sendNewsSummaryJSON() {
    try {
      const rssUrl = "https://vnexpress.net/rss/tin-moi-nhat.rss";

      // Lấy JSON từ RSS
      const data = await fetchRssAsJson(rssUrl);

      // Chọn 3-5 bài mới nhất
      const topArticles = data.items.slice(0, 5);

      // Gom nội dung để gửi sang GPT
      const textContent = topArticles
        .map((item: any, idx: number) => `${idx + 1}. ${item.title} - ${item.link}`)
        .join("\n");

      // Bây giờ bạn gọi API GPT để tóm tắt
      const userPrompt = `Hãy tóm tắt ngắn gọn các tin tức sau:\n${textContent}`;

      return userPrompt; // bạn có thể gửi cái này sang luồng askGPT sẵn có
    } catch (err) {
      console.error("sendNewsSummary error:", err);
      throw err;
    }
  }

  return { sendMessage, sendNewsSummary, sendNewsSummaryJSON };
}
