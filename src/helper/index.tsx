import {
  DefaultFileIcon,
  DocFileIcon,
  PdfFileIcon,
  PptFileIcon,
  XlsFileIcon,
} from "@/icons/other-icons";

export const getFileMeta = (ext: string) => {
  switch (ext.toLowerCase()) {
    case "pdf":
      return { color: "red.500", icon: <PdfFileIcon /> };
    case "doc":
    case "docx":
      return { color: "blue.500", icon: <DocFileIcon /> };
    case "xls":
    case "xlsx":
      return { color: "green.500", icon: <XlsFileIcon /> };
    case "ppt":
    case "pptx":
      return { color: "orange.500", icon: <PptFileIcon /> };
    default:
      return { color: "gray.500", icon: <DefaultFileIcon /> };
  }
};
