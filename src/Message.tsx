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
  return (
    <Box
      key={index}
      alignSelf={msg.role === "user" ? "flex-end" : "flex-start"}
      px={4}
      py={3}
      borderRadius="xl"
      bg={msg.role === "user" ? "#f6e9e1" : "#ffffff"}
      color={"#111111"}
      fontSize="15px"
      lineHeight="1.6"
      boxShadow="sm"
    >
      {/* Nếu có audioUrl thì chỉ hiện audio */}
      {msg.audioUrl ? (
        <Box mt={2}>
          <audio controls src={msg.audioUrl} />
        </Box>
      ) : (
        <>
          {/* Text content */}
          {msg.content ? (
            <MarkdownMessage content={msg.content} />
          ) : msg.role === "assistant" && streaming ? (
            <ThinkingMessage />
          ) : null}

          {/* Files đính kèm */}
          {msg.files && <FileMessages files={msg.files} />}
        </>
      )}
    </Box>
  );
};
