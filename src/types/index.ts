export type Role = "user" | "assistant" | "system";

export type ChatMsg = {
  role: Role;
  content: string;
  files?: UploadedFile[]; // Thêm thuộc tính files tùy chọn
};

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  fileId?: string; // id từ OpenAI trả về
  previewUrl?: string; // để hiển thị ảnh hoặc file blob trước khi gửi
  uploading: boolean; // trạng thái đang upload
}
