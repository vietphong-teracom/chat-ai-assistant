// src/hooks/useChatStream.ts
import type { ChatMsg, UploadedFile } from "@/types";
import { askGPT, generateTTS } from "@/lib/GPT";
import { fetchTopArticlesText } from "@/lib/fetchRss";

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
  isSoundOn: boolean;
  setIsSound: React.Dispatch<React.SetStateAction<boolean>>;
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
  isSoundOn,
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

    // Thêm message của user và placeholder cho assistant
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

      switch (true) {
        /* ========== CASE 1: Có file + isSoundOn = true ========== */
        case files.length > 0 && isSoundOn: {
          console.log("CASE 1: Có file + bật âm thanh");

          // Bước 1: Gọi GPT để xử lý file
          await handleGPTStreaming(
            newUserMessage,
            files,
            controller,
            (delta) => {
              assistantText += delta;
            }
          );

          // Bước 2: Sau khi GPT trả kết quả → tạo TTS từ câu trả lời GPT
          await appendTTSResult(assistantText, controller);
          break;
        }

        /* ========== CASE 2: Không có file + isSoundOn = true ========== */
        case files.length === 0 && isSoundOn: {
          console.log("CASE 2: Không có file + bật âm thanh");

          // Gọi TTS trực tiếp từ input của người dùng
          const audioUrl = await generateTTS(
            newUserMessage.content,
            controller.signal
          );

          setMsgs((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last?.role === "assistant") {
              copy[copy.length - 1] = { ...last, audioUrl };
            }
            return copy;
          });
          break;
        }

        /* ========== CASE 3: isSoundOn = false (xử lý GPT bình thường) ========== */
        case !isSoundOn: {
          console.log("CASE 3: Âm thanh tắt → GPT streaming bình thường");

          await handleGPTStreaming(
            newUserMessage,
            files,
            controller,
            (delta) => {
              assistantText += delta;
            }
          );
          break;
        }

        /* ========== CASE DEFAULT: An toàn, fallback ========== */
        default: {
          console.warn("Default case: không rơi vào logic nào, fallback GPT");
          await handleGPTStreaming(
            newUserMessage,
            files,
            controller,
            (delta) => {
              assistantText += delta;
            }
          );
          break;
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

  /* ======================= Helper Functions ======================= */

  // Hàm xử lý GPT streaming
  const handleGPTStreaming = async (
    userMsg: ChatMsg,
    files: UploadedFile[],
    controller: AbortController,
    onDelta: (delta: string) => void
  ) => {
    await askGPT(
      [...msgs, userMsg],
      (delta) => {
        onDelta(delta);
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
      },
      files,
      controller.signal
    );
  };

  // Hàm tạo TTS và append vào message cuối
  const appendTTSResult = async (text: string, controller: AbortController) => {
    const audioUrl = await generateTTS(text, controller.signal);
    setMsgs((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      if (last?.role === "assistant") {
        copy[copy.length - 1] = { ...last, audioUrl };
      }
      return copy;
    });
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
