import { QUICK_PROMPT } from '@/const';
import { extractTextFromFile } from '@/helper/extractText';
import { getRssFeed } from '@/helper/getRssFeed';
import { fetchTopArticlesText } from '@/lib/fetchRss';
import { callAPIGPT } from '@/lib/gpt/chatResponse';
import { generateSTT } from '@/lib/gpt/speechToText';
import { generateTTS } from '@/lib/gpt/textToSpeech';
import { QuickPrompt, type ChatMsg, type Role, type UploadedFile } from '@/types';

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
  const assistantEmptyMsg = { role: 'assistant' as Role, content: '' };
  const appendStreamingMsg = (delta: string) => {
    setMsgs((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      if (last?.role === 'assistant') {
        copy[copy.length - 1] = { ...last, content: (last.content || '') + delta };
      }
      return copy;
    });
  };

  const askGPT = async (gptMsgs: ChatMsg[]) => {
    setStreaming(true);
    setError(null);

    // Tạo AbortController
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await callAPIGPT(gptMsgs, appendStreamingMsg, controller.signal);
    } catch (err: any) {
      console.error('Chat stream error:', err);
      setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const chatQaA = async () => {
    if (!inputValue || streaming) return;
    const userMsg: ChatMsg = {
      role: 'user' as Role,
      displayContent: inputValue,
      content: inputValue,
      files,
    };
    if (files.length) {
      const fileContent = await extractTextFromFile(files?.[0]?.rawFile);
      userMsg.content = `${inputValue}:\n\n${fileContent}`;
    }
    const newMsg = [...msgs, userMsg, assistantEmptyMsg];
    setMsgs(newMsg);
    setInputValue('');
    setFiles([]);
    askGPT(newMsg);
  };

  const summaryDocument = async (file: File) => {
    if (!file || streaming) return;
    try {
      const fileContent = await extractTextFromFile(file);
      const displayContent = QUICK_PROMPT[QuickPrompt.SUMMARY];
      const userMsg = {
        role: 'user' as Role,
        displayContent,
        content: `${displayContent}:\n\n${fileContent}`,
        files: [
          {
            name: file.name,
            size: file.size,
            type: file.type,
            previewUrl: URL.createObjectURL(file),
          },
        ],
      };
      const newMsg = [...msgs, userMsg, assistantEmptyMsg];
      setMsgs(newMsg);
      await askGPT(newMsg);
    } catch (err) {
      console.error('Lỗi khi đọc file:', err);
      setError('Không thể đọc nội dung từ file');
    }
  };

  const ttsDocument = async (file: File) => {
    if (!file || streaming) return;
    try {
      const fileContent = await extractTextFromFile(file);
      const displayContent = QUICK_PROMPT[QuickPrompt.TTS];
      const userMsg = {
        role: 'user' as Role,
        displayContent,
        content: `${displayContent}:\n\n${fileContent}`,
        files: [
          {
            name: file.name,
            size: file.size,
            type: file.type,
            previewUrl: URL.createObjectURL(file),
          },
        ],
      };
      const newMsg = [...msgs, userMsg, assistantEmptyMsg];
      setMsgs(newMsg);
      setStreaming(true);
      setError(null);
      // Tạo AbortController
      const controller = new AbortController();
      abortRef.current = controller;

      const url = await generateTTS(fileContent);
      // Cập nhật lại message cuối cùng với audioUrl

      setMsgs((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.role === 'assistant') {
          copy[copy.length - 1] = { ...last, audioUrl: url };
        }
        return copy;
      });
    } catch (err) {
      console.error('Lỗi khi đọc file:', err);
      setError('Hiện tại chỉ hỗ trợ cho file PDF , k hỗ trợ các file khác');
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const sttDocument = async (file: File) => {
    if (!file || streaming) return;

    try {
      const displayContent = QUICK_PROMPT[QuickPrompt.STT]; // ✅ prompt mô tả STT

      // Tạo user message từ file âm thanh
      const userMsg = {
        role: 'user' as Role,
        displayContent,
        content: displayContent, // có thể để trống hoặc mô tả
        files: [
          {
            name: file.name,
            size: file.size,
            type: file.type,
            previewUrl: URL.createObjectURL(file),
            rawFile: file, // đảm bảo đúng kiểu UploadedFile
          },
        ],
      };

      // Cập nhật UI với user message + placeholder assistant
      const newMsg = [...msgs, userMsg, assistantEmptyMsg];
      setMsgs(newMsg);
      setStreaming(true);
      setError(null);

      // Tạo AbortController để hủy request khi cần
      const controller = new AbortController();
      abortRef.current = controller;

      // Gọi API STT để chuyển file audio thành văn bản
      const text = await generateSTT(file, controller.signal);

      // Cập nhật message cuối cùng (assistant) với text trả về
      setMsgs((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.role === 'assistant') {
          copy[copy.length - 1] = { ...last, content: text, displayContent: text };
        }
        return copy;
      });
    } catch (err) {
      console.error('Lỗi khi chuyển giọng nói thành văn bản:', err);
      setError('Không thể chuyển giọng nói thành văn bản.');
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  async function summaryNews(feedKey = 'vnexpress') {
    if (streaming) return;

    const userTyped = 'Cập nhật tin tức mới nhất trong ngày';
    const userMsg: ChatMsg = { role: 'user', displayContent: userTyped, content: '' };
    const newMsgs = [...msgs, userMsg];
    setMsgs(newMsgs);
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
      const prompt = `Nguồn: ${feedUrl}\n\n${feedText}\n\nYêu cầu: ${userTyped}`;

      // 3) prepare messages for API: replace last user message with enriched content
      const promptMsgs = [...newMsgs.slice(0, -1), { ...userMsg, content: prompt }];

      // Thêm message rỗng của assistant để khi có res thì append stream sau
      setMsgs([...promptMsgs, { role: 'assistant', content: '' }]);

      // 4) call the GPT streaming API
      await askGPT(promptMsgs);
      setError(null);
    } catch (err: any) {
      if (err?.name === 'AbortError') setError('Đã hủy truy vấn.');
      else setError(err?.message ?? 'Lỗi khi lấy/tóm tắt tin tức');
      console.error('sendNewsSummary error:', err);
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  return { chatQaA, summaryDocument, ttsDocument, summaryNews, sttDocument };
}
