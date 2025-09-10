import { VStack } from "@chakra-ui/react";
import { Message } from "./Message";
import { ChatMsg } from "./types";

interface ConversationProps {
  msgs: ChatMsg[];
  streaming: boolean;
  scrollRef: React.RefObject<HTMLDivElement>;
}

export function Conversation({ msgs, streaming, scrollRef }: ConversationProps) {
  return (
    <VStack gap={4} align="stretch" maxW="768px" w="100%">
      {msgs
        .filter((msg) => msg.role !== "system")
        .map((msg, index) => (
          <Message msg={msg} index={index} streaming={streaming} />
        ))}
      <div ref={scrollRef} />
    </VStack>
  );
}
