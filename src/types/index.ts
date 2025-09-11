export type Role = 'user' | 'assistant' | 'system';

export enum QuickPrompt {
  SUMMARY = 'summary',
  TRANSLATION = 'translation',
  TTS = 'tts',
}

export type ChatMsg = {
  role: Role;
  content: string;
  displayContent?: string;
  files?: UploadedFile[];
  audioUrl?: string;
};

export interface UploadedFile {
  rawFile: File;
  fileName: string;
  fileSize: number;
  fileType: string;
  filePreviewUrl?: string;
  filePrompt: QuickPrompt;
}

export type InputContent = { type: 'input_text'; text: string } | { type: 'input_file'; file_id: string };

export type InputMessage = {
  role: 'user' | 'system';
  content: InputContent[];
};
