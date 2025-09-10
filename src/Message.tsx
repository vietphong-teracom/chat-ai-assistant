import { Box } from "@chakra-ui/react";
import { MarkdownMessage } from "./MarkdownMessage";
import { ThinkingMessage } from "./ThinkingMessage";
import { FileMessages } from "./FileMessage";
import { ChatMsg } from "./types";

type MessageProps = {
  msg: ChatMsg;
  index: number;
  streaming: boolean;
};

export const Message = ({ msg, index, streaming }: MessageProps) => {
  let renderMessage = null;

  if (msg.audioUrl) {
    // Nếu có audioUrl thì ưu tiên hiển thị audio
    renderMessage = <audio src={msg.audioUrl} controls />;
  } else if (msg.content) {
    // Nếu có text content thì hiển thị MarkdownMessage
    renderMessage = <MarkdownMessage content={msg.content} />;
  } else if (msg.role === "assistant" && streaming) {
    // Nếu là assistant và đang stream thì hiển thị ThinkingMessage
    renderMessage = <ThinkingMessage />;
  }

  return (
    <Box
      key={index}
      alignSelf={msg.role === "user" ? "flex-end" : "flex-start"}
      px={4}
      py={3}
      borderRadius="xl"
      bg={msg.role === "user" ? "#f7f6f1" : "#ffffff"}
      color="#111111"
      fontSize="15px"
      lineHeight="1.6"
      boxShadow="sm"
    >
      {/* Nội dung chính */}
      {renderMessage}

      {/* Hiển thị file khác chỉ khi không có audioUrl */}
      {!msg.audioUrl && msg.files && <FileMessages files={msg.files} />}
    </Box>
  );
};
