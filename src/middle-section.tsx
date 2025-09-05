import {
  Box,
  Center,
  Flex,
  Heading,
  HStack,
  IconButton,
  VStack,
  Text,
} from "@chakra-ui/react";
import {
  BirthdayIcon,
  ChartIcon,
  CodeIcon,
  EnterIcon,
  IllustrationIcon,
  UploadIcon,
} from "./icons/other-icons";
import { useState, useRef, useEffect } from "react";
import { Button } from "./components/ui/button";
import { askStream, ChatMsg, Role } from "./lib/openai";
import { MarkdownMessage } from "./MarkdownMessage";
import type { KeyboardEvent, SetStateAction } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { getFileMeta } from "./helper";

// ✅ import getFileMeta

interface PromptButtonProps {
  icon?: React.ReactElement;
  description: string;
}

function PromptButton(props: PromptButtonProps) {
  const { icon, description } = props;
  return (
    <Button variant="outline" borderRadius="full">
      {icon}
      <Box ml={2}>{description}</Box>
    </Button>
  );
}

export function MiddleSection() {
  const [inputValue, setInputValue] = useState("");
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    {
      role: "system",
      content: "Bạn là trợ lý hữu ích, trả lời ngắn gọn, rõ ràng.",
    },
  ]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // State quản lý file
  const [files, setFiles] = useState<File[]>([]);

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

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendStream();
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const userBg = "#f7f7f8";
  const assistantBg = "#ffffff";
  const textColor = "#111";

  return (
    <Center flex="1">
      <VStack gap="6" w="100%">
        <Heading size="3xl">What can I help with?</Heading>

        {/* Conversation */}
        <Center w="100%">
          <VStack gap={4} align="stretch" maxW="768px" w="100%">
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
        <Center w="100%">
          <Flex
            maxW="768px"
            w="100%"
            borderRadius="3xl"
            border="1px solid #ccc"
            p={2}
            align="center"
            gap={2}
            bg="white"
          >
            {/* Upload */}
            <Box w="40px" flexShrink={0}>
              <input
                type="file"
                id="file-input"
                style={{ display: "none" }}
                multiple
                onChange={handleSelect}
              />
              <label htmlFor="file-input">
                <IconButton
                  aria-label="Upload file"
                  size="sm"
                  borderRadius="full"
                  variant="ghost"
                  as="span"
                  w="100%"
                  h="100%"
                >
                  <UploadIcon fontSize="2xl" />
                </IconButton>
              </label>
            </Box>

            {/* Files + textarea */}
            <VStack flex="1" align="stretch" spacing={1}>
              {files.length > 0 && (
                <VStack align="stretch" spacing={2}>
                  {files.map((file, index) => {
                    const ext = file.name.split(".").pop() || "";
                    const { color, icon } = getFileMeta(ext);

                    return (
                      <Flex
                        key={index}
                        align="center"
                        border="1px solid #e2e2e2"
                        borderRadius="lg"
                        px={2}
                        py={2}
                        bg="gray.50"
                        gap={3}
                        w="fit-content"
                      >
                        {/* Icon */}
                        <Box
                          w="36px"
                          h="36px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          borderRadius="md"
                          bg={color}
                          color="white"
                          fontSize="18px"
                          flexShrink={0}
                        >
                          {icon}
                        </Box>

                        {/* Info */}
                        <Flex direction="column" flex="1" minW={0}>
                          <Text
                            fontSize="sm"
                            fontWeight="bold"
                            whiteSpace="nowrap"
                            textOverflow="ellipsis"
                            overflow="hidden"
                          >
                            {file.name}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {ext.toUpperCase()}
                          </Text>
                        </Flex>

                        {/* Remove */}
                        <IconButton
                          aria-label="Remove file"
                          size="xs"
                          variant="ghost"
                          onClick={() => removeFile(index)}
                        >
                          ✕
                        </IconButton>
                      </Flex>
                    );
                  })}
                </VStack>
              )}

              {/* Textarea */}
              <TextareaAutosize
                minRows={1}
                maxRows={5}
                placeholder="Message ChatGPT"
                value={inputValue}
                onChange={(e: { target: { value: SetStateAction<string> } }) =>
                  setInputValue(e.target.value)
                }
                onKeyDown={handleKeyDown}
                style={{
                  width: "100%",
                  borderRadius: "24px",
                  padding: "6px 10px",
                  resize: "none",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                }}
              />
            </VStack>

            {/* Send */}
            <IconButton
              aria-label="Send message"
              size="sm"
              borderRadius="full"
              disabled={inputValue.trim() === "" || streaming}
              onClick={sendStream}
              variant="solid"
            >
              <EnterIcon fontSize="2xl" />
            </IconButton>
          </Flex>
        </Center>

        {/* Prompt buttons */}
        <HStack gap="2">
          <PromptButton
            icon={<IllustrationIcon color="green.500" fontSize="lg" />}
            description="Create image"
          />
          <PromptButton
            icon={<CodeIcon color="blue.500" fontSize="lg" />}
            description="Code"
          />
          <PromptButton
            icon={<ChartIcon color="cyan.400" fontSize="lg" />}
            description="Analyze data"
          />
          <PromptButton
            icon={<BirthdayIcon color="cyan.400" fontSize="lg" />}
            description="Surprise"
          />
          <PromptButton description="More" />
        </HStack>
      </VStack>
    </Center>
  );
}
