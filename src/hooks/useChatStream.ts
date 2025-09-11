import type { ChatMsg, Role, UploadedFile } from "@/types";
import { fetchTopArticlesText } from "@/lib/fetchRss";
import { askGPT } from "@/lib/gpt/QaA";
import { generateTTS } from "@/lib/gpt/textToSpeech";
import { getRssFeed } from "@/helper/getRssFeed";
import { generateSTT } from "@/lib/gpt/speechToText";

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
  const assistantEmptyMessage = { role: "assistant" as Role, content: "" };
  const appendStreamingData = (delta: string) => {
    setMsgs((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      if (last?.role === "assistant") {
        copy[copy.length - 1] = { ...last, content: (last.content || "") + delta };
      }
      return copy;
    });
  };

  const askGPTQuestion = async () => {
    if ((!inputValue && files.length === 0) || streaming) return;
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
    // append user message and assistantEmptyMessage
    const nextMsgs = [...msgs, newUserMessage, assistantEmptyMessage];
    setMsgs(nextMsgs);
    setInputValue("");
    setFiles([]);
    setStreaming(true);
    setError(null);

    // Tạo AbortController
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await askGPT(nextMsgs, appendStreamingData, files, controller.signal);
    } catch (err: any) {
      console.error("Chat stream error:", err);
      setError(err.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  async function askGPTSummaryNews(feedKey = "vnexpress") {
    if (streaming) return;

    const userPrompt = "Cập nhật tin tức mới nhất trong ngày";
    const userMsg: ChatMsg = { role: "user", content: userPrompt };

    // append user message and assistantEmptyMessage
    const nextMsgs = [...msgs, userMsg];
    setMsgs(nextMsgs);
    setStreaming(true);
    setError(null);

    // Tạo AbortController
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // 1) fetch feed as text (top N articles)
      const feedUrl = getRssFeed(feedKey);
      const feedText = await fetchTopArticlesText(feedUrl, 10, controller.signal);

      // 2) construct final user content (we do NOT show the full feedText in UI to keep it clean)
      const finalUserContent = `Nguồn: ${feedUrl}\n\n${feedText}\n\nYêu cầu: ${userPrompt}`;

      // 3) prepare messages for API: replace last user message with enriched content
      const msgsForApi: ChatMsg[] = [...nextMsgs.slice(0, -1), { ...userMsg, content: finalUserContent }];

      // Thêm message rỗng của assistant để khi có res thì append stream sau
      setMsgs((prev) => [...prev, { role: "assistant", content: "" }]);

      // 4) call the GPT streaming API
      await askGPT(msgsForApi, appendStreamingData, [], controller.signal);
      setError(null);
    } catch (err: any) {
      if (err?.name === "AbortError") setError("Đã hủy truy vấn.");
      else setError(err?.message ?? "Lỗi khi lấy/tóm tắt tin tức");
      console.error("sendNewsSummary error:", err);
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  async function askGPTTextToSpeech() {
    if ((!inputValue && files.length === 0) || streaming) return;

    const userPrompt = inputValue ? "Đọc đoạn văn bản sau" : "Đọc văn bản tài liệu sau";
    const finalUserContent = `${userPrompt}: \n\n${inputValue}`;

    const userMsg: ChatMsg = { role: "user", content: finalUserContent };

    // Append user message immediately to UI
    const nextMsgs = [...msgs, userMsg];
    setMsgs(nextMsgs);
    setInputValue("");

    setStreaming(true);
    setError(null);

    // ✅ Thêm assistant message placeholder để hiển thị ThinkingMessage
    setMsgs((prev) => [...prev, { role: "assistant", content: "" }]);
    try {
      const url = await generateTTS(inputValue);
      // Cập nhật lại message cuối cùng với audioUrl
      setMsgs((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.role === "assistant") {
          copy[copy.length - 1] = { ...last, audioUrl: url };
        }
        return copy;
      });
    } catch (err: any) {
      console.error("sendTextToSpeech error:", err);
      setError(err?.message || "Không thể tạo audio từ văn bản.");
    } finally {
      setStreaming(false);
    }
  }
async function askSpeechToText(file: File) {
  if (streaming) return;

  setError(null);
  setStreaming(true);

  // Thêm message placeholder của assistant
  setMsgs((prev) => [...prev, { role: "assistant", content: "" }]);

  try {
    // ✅ Gọi hàm generateSTT có sẵn
    const text = await generateSTT(file, abortRef.current?.signal);

    // Cập nhật message assistant với văn bản
    setMsgs((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      if (last?.role === "assistant") {
        copy[copy.length - 1] = { ...last, content: text };
      }
      return copy;
    });
  } catch (err: any) {
    console.error("askSpeechToText error:", err);
    setError(err?.message || "Không thể chuyển giọng nói thành văn bản.");
  } finally {
    setStreaming(false);
  }
}


  return { askGPTQuestion, askGPTSummaryNews, askGPTTextToSpeech,askSpeechToText };
}
