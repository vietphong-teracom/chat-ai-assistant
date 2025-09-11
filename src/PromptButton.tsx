import { Box, HStack, VStack } from "@chakra-ui/react";
import { FaRegNewspaper } from "react-icons/fa";
import { FiFileText } from "react-icons/fi";
import { GrDocumentSound } from "react-icons/gr";
import "../src/lib/index.css";
import { Button } from "./components/ui/button";
import { UploadedFile } from "./types";

interface PromptButtonProps {
  icon?: React.ReactElement;
  description: string;
  onClick?: () => void;
  disabled?: boolean;
}

function PromptButton({ icon, description, onClick, disabled }: PromptButtonProps) {
  return (
    <Button
      variant="outline"
      borderRadius="full"
      onClick={onClick}
      bg={"#f8f5f4"}
      disabled={disabled}
    >
      {icon}
      <Box ml={2}>{description}</Box>
    </Button>
  );
}

interface PromptButtonsProps {
  files: UploadedFile[];
  inputValue: string;
  streaming: boolean;
  onSummaryNews?: () => void;
  onTextToSpeech?: () => void;
  onSpeechToText: (file: File) => void;
  addUserAudio: (audioUrl: string) => void;
}

export function PromptButtons({
  files,
  inputValue,
  streaming,
  onSummaryNews,
  onTextToSpeech,
  onSpeechToText,
  addUserAudio
}: PromptButtonsProps) {

  const isDisabledBtn = streaming || (!files?.[0]?.fileId && !inputValue);

  const handleSpeechFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const url = URL.createObjectURL(file);
    addUserAudio( url);
    onSpeechToText(file);
    e.target.value = ""; // reset input
  };

  return (
    <VStack align="start" >
      <HStack gap="4" mb={2}>
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

        <PromptButton
          disabled={streaming}
          icon={<GrDocumentSound color="#538336ff" fontSize="lg" />}
          description="Chuyển giọng nói thành văn bản"
          onClick={() => document.getElementById("speech-file")?.click()}
        />
        <input
          id="speech-file"
          type="file"
          accept="audio/*"
          style={{ display: "none" }}
          onChange={handleSpeechFile}
        />
      </HStack>

     
    </VStack>
  );
}
