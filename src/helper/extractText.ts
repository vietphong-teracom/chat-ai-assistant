import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return fullText.trim();
  } catch (err) {
    console.error('Lỗi khi đọc PDF:', err);
    throw err;
  }
}

export async function extractTextFromTxt(file: File): Promise<string> {
  try {
    return await file.text();
  } catch (err) {
    console.error('Lỗi khi đọc TXT:', err);
    throw new Error('Không thể trích xuất nội dung từ TXT');
  }
}

export async function extractTextFromFile(file: File): Promise<string> {
  try {
    if (file.type === 'application/pdf') {
      return await extractTextFromPdf(file);
    }

    if (file.type === 'text/plain') {
      return await extractTextFromTxt(file);
    }

    throw new Error('Định dạng file chưa được hỗ trợ');
  } catch (err) {
    console.error('Lỗi khi trích xuất nội dung:', err);
    throw new Error('Không thể đọc nội dung từ file');
  }
}
