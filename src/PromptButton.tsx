// src/PromptButton.tsx (hoặc file PromptButtons.tsx)
import { Box, HStack } from "@chakra-ui/react";
import "../src/lib/index.css";
import { Button } from "./components/ui/button";
import { FaRegNewspaper, FaVolumeUp } from "react-icons/fa";
import { FcNews } from "react-icons/fc";
import { GrDocumentPerformance, GrDocumentSound } from "react-icons/gr";
import { UploadedFile } from "./types";
import { HiOutlineDocumentSearch } from "react-icons/hi";
import { AiOutlineFileDone } from "react-icons/ai";
import { FiFileText } from "react-icons/fi";

interface PromptButtonProps {
  icon?: React.ReactElement;
  description: string;
  onClick?: () => void;
  disabled?: boolean;
}

function PromptButton({ icon, description, onClick, disabled }: PromptButtonProps) {
  return (
    <Button variant="outline" borderRadius="full" onClick={onClick} bg={"#f8f5f4"} disabled={disabled}>
      {icon}
      <Box>{description}</Box>
    </Button>
  );
}

interface PromptButtonsProps {
  files: UploadedFile[];
  inputValue: string;
  streaming: boolean;
  onSummaryNews?: () => void;
  onTextToSpeech?: () => void;
}
export function PromptButtons({ files, inputValue, streaming, onSummaryNews, onTextToSpeech }: PromptButtonsProps) {
  const isDisabledBtn = streaming || (!files?.[0]?.fileId && !inputValue);
  return (
    <HStack gap="4" mb={6}>
      <PromptButton
        icon={<FaRegNewspaper color="#ce88f9ff" fontSize="lg" />}
        description="Cập Nhật Tin Tức"
        onClick={onSummaryNews}
      />
      <PromptButton
        disabled
        icon={<FiFileText fontSize="lg" color="#eeb170ff" />}
        description="Tóm Tắt Văn Bản"
        onClick={onSummaryNews}
      />
      <PromptButton
        disabled={isDisabledBtn}
        icon={<GrDocumentSound color="#538336ff" fontSize="lg" />}
        description="Đọc Văn Bản"
        onClick={onTextToSpeech}
      />
      {/* <PromptButton icon={<BirthdayIcon color="cyan.400" fontSize="lg" />} description="Surprise" />
      <PromptButton description="More" /> */}
    </HStack>
  );
}
