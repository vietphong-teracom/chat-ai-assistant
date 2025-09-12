import { QuickPrompt } from './types';

export const QUICK_PROMPT: Record<QuickPrompt, string> = {
  [QuickPrompt.SUMMARY]: 'Hãy tóm tắt văn bản sau',
  [QuickPrompt.TRANSLATION]: 'Hãy dịch văn bản sau',
  [QuickPrompt.TTS]: 'Hãy chuyển văn bản này thành giọng đọc',
  [QuickPrompt.STT]: 'Hãy chuyển file âm thanh thành văn bản',
};
