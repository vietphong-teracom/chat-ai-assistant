import { Box, Center, Flex, Heading, IconButton, Spinner, Text, VStack } from "@chakra-ui/react";
import type { KeyboardEvent, SetStateAction } from "react";
import TextareaAutosize from "react-textarea-autosize";
import "../src/lib/index.css";
import { FileMessages } from "./FileMessage";
import { getFileMeta } from "./helper";
import { useChat } from "./hooks/useChat";
import { EnterIcon, UploadIcon } from "./icons/other-icons";
import { removeFile } from "./lib/remove-file-uploaded";
import { uploadFile } from "./lib/upload-file";
import { MarkdownMessage } from "./MarkdownMessage";
import { PromptButtons } from "./PromptButton";
import { UploadedFile } from "./types";

export function MiddleSection() {
  const { msgs, streaming, files, setFiles, inputValue, setInputValue, sendStream, scrollRef } = useChat();

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendStream();
    }
  };

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selectedFiles = Array.from(e.target.files);

    for (const file of selectedFiles) {
      const previewUrl = URL.createObjectURL(file);

      // 1. Thêm vào state trước với trạng thái uploading = true
      setFiles((prev) => [
        ...prev,
        {
          name: file.name,
          size: file.size,
          type: file.type,
          previewUrl,
          uploading: true, // đang upload
        },
      ]);

      // 2. Bắt đầu upload lên server
      const formData = new FormData();
      formData.append("file", file);
      formData.append("purpose", "assistants");

      const data = await uploadFile({ formData, setFiles, previewUrl });

      setFiles((prev) =>
        prev.map((f) => (f.previewUrl === previewUrl ? { ...f, fileId: data.id, uploading: false } : f))
      );
    }

    e.target.value = "";
  };

  return (
    <Center flex="1">
      <VStack gap="6" w="100%">
        <Heading size="3xl">What can I help with?</Heading>

        {/* Conversation */}
        <Center w="100%">
          <VStack gap={4} align="stretch" maxW="768px" w="100%">
            {msgs
              .filter((msg) => msg.role !== "system")
              .map((msg, i) => (
                <Box
                  key={i}
                  alignSelf={msg.role === "user" ? "flex-end" : "flex-start"}
                  px={4}
                  py={3}
                  borderRadius="xl"
                  bg={msg.role === "user" ? "#f7f7f8" : "#ffffff"}
                  color={"#111111"}
                  fontSize="15px"
                  lineHeight="1.6"
                  boxShadow="sm"
                >
                  {/* Nội dung text */}
                  {msg.content ? (
                    <MarkdownMessage content={msg.content} />
                  ) : msg.role === "assistant" && streaming ? (
                    // Hiển thị animation 3 chấm khi assistant đang trả lời
                    <Box className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </Box>
                  ) : null}

                  {/* Files đính kèm trong message */}
                  {msg.files && <FileMessages files={msg.files as UploadedFile[]} />}
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
              <input type="file" id="file-input" style={{ display: "none" }} multiple onChange={handleSelect} />
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
            <VStack flex="1" align="stretch" gap={1}>
              {files.length > 0 && (
                <VStack align="stretch" gap={2}>
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
                        {/* Nếu là ảnh → preview thumbnail */}
                        {file.type.startsWith("image/") ? (
                          <img
                            src={file.previewUrl || ""}
                            alt={file.name}
                            style={{
                              width: 50,
                              height: 50,
                              objectFit: "cover",
                              borderRadius: "6px",
                            }}
                          />
                        ) : (
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
                        )}

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

                        {/* Nếu đang upload → Spinner */}
                        {file.uploading ? (
                          <Spinner size="sm" color="blue.500" />
                        ) : (
                          <IconButton
                            aria-label="Remove file"
                            size="xs"
                            variant="ghost"
                            onClick={() => removeFile({ files, setFiles, index })}
                          >
                            ✕
                          </IconButton>
                        )}
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
                onChange={(e: { target: { value: SetStateAction<string> } }) => setInputValue(e.target.value)}
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
              disabled={(inputValue.trim() === "" && files.length === 0) || streaming}
              onClick={sendStream}
              variant="solid"
            >
              <EnterIcon fontSize="2xl" />
            </IconButton>
          </Flex>
        </Center>

        {/* Prompt buttons */}
        <PromptButtons />
      </VStack>
    </Center>
  );
}
