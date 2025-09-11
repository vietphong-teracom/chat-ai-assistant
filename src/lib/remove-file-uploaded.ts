import { UploadedFile } from '@/types';
import { SetStateAction } from 'react';

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string;
const API_URL = import.meta.env.VITE_OPENAI_API_URL as string;

if (!API_KEY) {
  throw new Error('Missing VITE_OPENAI_API_KEY in environment variables');
}
if (!API_URL) {
  throw new Error('Missing VITE_OPENAI_API_URL in environment variables');
}

type RemoveFileProp = {
  files: UploadedFile[];
  index: number;
  setFiles: React.Dispatch<SetStateAction<UploadedFile[]>>;
};

export const removeFile = async ({ files, setFiles, index }: RemoveFileProp) => {
  try {
    const fileToDelete = files[index];
    // if (!fileToDelete?.fileId) {
    //   // Nếu chưa upload xong thì chỉ xóa local
    //   setFiles((prev) => prev.filter((_, i) => i !== index));
    //   return;
    // }

    const res = await fetch(`${API_URL}/files/${fileToDelete.fileName}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Xóa file thất bại: ${errText}`);
    }

    setFiles((prev) => prev.filter((_, i) => i !== index));
  } catch (error) {
    console.error(error);
  }
};
