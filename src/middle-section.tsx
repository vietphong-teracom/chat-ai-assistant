import { Box, Center, Heading, HStack, IconButton, Input, Span, Text, VStack } from "@chakra-ui/react";
import { FileUploadList, FileUploadRoot, FileUploadTrigger } from "./components/ui/file-button";
import { InputGroup } from "./components/ui/input-group";
import { BirthdayIcon, ChartIcon, CodeIcon, EnterIcon, IllustrationIcon, UploadIcon } from "./icons/other-icons";
import { useState, useRef, useEffect } from "react";
import { Button } from "./components/ui/button";
import { askStream, ChatMsg, Role } from "./lib/openai";
import { MarkdownMessage } from "./MarkdownMessage";

interface PromptButtonProps {
  icon?: React.ReactElement;
  description: string;
}

function PromptButton(props: PromptButtonProps) {
  const { icon, description } = props;
  return (
    <Button variant="outline" borderRadius="full">
      {icon}
      <Span color="fg.subtle">{description}</Span>
    </Button>
  );
}

export function MiddleSection() {
  const [inputValue, setInputValue] = useState("");
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { role: "system", content: "Bạn là trợ lý hữu ích, trả lời ngắn gọn, rõ ràng." },
  ]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const sendStream = async () => {
    if (!inputValue.trim() || streaming) return;
    const next = [...msgs, { role: "user" as Role, content: inputValue }];
    setMsgs(next);
    setInputValue("");
    setStreaming(true);
    abortRef.current = new AbortController();

    let acc = "";
    setMsgs((prev) => [...prev, { role: "assistant", content: "" }]);

    const onDelta = (delta: string) => {
      acc += delta;
      setMsgs((prev) => {
        const copy = [...prev];
        // Cập nhật message cuối (assistant) với phần text vừa stream về
        copy[copy.length - 1] = { role: "assistant", content: acc };
        return copy;
      });
    };

    try {
      await askStream(next, onDelta, "gpt-4o-mini", abortRef.current.signal);
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  // const stop = () => {
  //   abortRef.current?.abort();
  //   setStreaming(false);
  // };

  // Auto scroll to bottom khi có tin nhắn mới
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const userBg = "#f7f7f8";
  const assistantBg = "#ffffff";
  const textColor = "#111";

  return (
    <Center flex="1">
      <VStack gap="6" w="100%">
        <Heading size="3xl">What can I help with?</Heading>

        {/* Conversation */}
        <Center w="100%">
          <VStack gap={4} align="stretch" w="768px">
            {msgs
              .filter((m) => m.role !== "system")
              .map((m, i) => (
                <Box
                  key={i}
                  alignSelf={m.role === "user" ? "flex-end" : "flex-start"}
                  px={4}
                  py={3}
                  borderRadius="xl"
                  bg={m.role === "user" ? userBg : assistantBg}
                  color={textColor}
                  fontSize="15px"
                  lineHeight="1.6"
                  boxShadow="sm"
                >
                  <MarkdownMessage content={m.content} />
                </Box>
              ))}
            <div ref={scrollRef} />
          </VStack>
        </Center>

        {/* Input */}
        <Center>
          <InputGroup
            minW="768px"
            startElement={
              <FileUploadRoot>
                <FileUploadTrigger asChild>
                  <UploadIcon fontSize="2xl" color="fg" />
                </FileUploadTrigger>
                <FileUploadList />
              </FileUploadRoot>
            }
            endElement={
              <IconButton
                fontSize="2xl"
                size="sm"
                borderRadius="full"
                disabled={inputValue.trim() === "" || streaming}
                onClick={sendStream}
              >
                <EnterIcon fontSize="2xl" />
              </IconButton>
            }
          >
            <Input
              placeholder="Message ChatGPT"
              variant="subtle"
              size="lg"
              borderRadius="3xl"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </InputGroup>
        </Center>

        {/* Prompt buttons */}
        <HStack gap="2">
          <PromptButton icon={<IllustrationIcon color="green.500" fontSize="lg" />} description="Create image" />
          <PromptButton icon={<CodeIcon color="blue.500" fontSize="lg" />} description="Code" />
          <PromptButton icon={<ChartIcon color="cyan.400" fontSize="lg" />} description="Analyze data" />
          <PromptButton icon={<BirthdayIcon color="cyan.400" fontSize="lg" />} description="Surprise" />
          <PromptButton description="More" />
        </HStack>
      </VStack>
    </Center>
  );
}
