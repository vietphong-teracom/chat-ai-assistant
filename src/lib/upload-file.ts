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

type UploadFileProp = {
  formData: FormData;
  setFiles: React.Dispatch<SetStateAction<UploadedFile[]>>;
  previewUrl: string;
};

export const uploadFile = async ({ formData, setFiles, previewUrl }: UploadFileProp) => {
  try {
    const res = await fetch(`${API_URL}/files`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
      body: formData,
    });

    if (!res.ok) throw new Error('Upload failed');
    return await res.json();
  } catch (err) {
    console.error('Error uploading file:', err);
    setFiles((prev) => prev.filter((f) => f.filePreviewUrl !== previewUrl));
  }
};

export async function handleFileUpload(
  e: React.ChangeEvent<HTMLInputElement>,
  setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>
) {
  if (!e.target.files) return;
  const selectedFiles = Array.from(e.target.files);

  for (const file of selectedFiles) {
    const previewUrl = URL.createObjectURL(file);

    // Add vào state (uploading)
    //setFiles((prev) => [...prev, { name: file.name, size: file.size, type: file.type, previewUrl, uploading: true }]);

    // Upload lên OpenAI
    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', 'assistants');

    const data = await uploadFile({ formData, setFiles, previewUrl });

    setFiles((prev) =>
      prev.map((f) => (f.filePreviewUrl === previewUrl ? { ...f, fileId: data.id, uploading: false } : f))
    );
  }

  e.target.value = '';
}
