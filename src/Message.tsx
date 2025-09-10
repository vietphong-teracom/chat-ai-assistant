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
  console.log("mesage", msg);
  return (
    <Box
      key={index}
      alignSelf={msg.role === "user" ? "flex-end" : "flex-start"}
      px={4}
      py={3}
      borderRadius="xl"
      bg={msg.role === "user" ? "#f7f6f1" : "#ffffff"}
      color={"#111111"}
      fontSize="15px"
      lineHeight="1.6"
      boxShadow="sm"
    >
      {msg.audioUrl ? (
        <audio src={msg.audioUrl} controls />
      ) : msg.content ? (
        <MarkdownMessage content={msg.content} />
      ) : msg.role === "assistant" && streaming ? (
        <ThinkingMessage />
      ) : null}

      {/* Hiển thị file khác chỉ khi không có audioUrl */}
      {!msg.audioUrl && msg.files && <FileMessages files={msg.files} />}
    </Box>
  );
};
