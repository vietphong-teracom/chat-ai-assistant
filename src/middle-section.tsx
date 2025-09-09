import { Box, Center, Flex, Heading, IconButton, Spinner, Text, VStack } from "@chakra-ui/react";
import type { KeyboardEvent, SetStateAction } from "react";
import TextareaAutosize from "react-textarea-autosize";
import "../src/lib/index.css";
import { ErrorMessage } from "./ErrorMessage";
import { getFileMeta } from "./helper";
import { useChatState } from "./hooks/useChatState";
import { useChatStream } from "./hooks/useChatStream";
import { EnterIcon, UploadIcon } from "./icons/other-icons";
import { removeFile } from "./lib/remove-file-uploaded";
import { uploadFile } from "./lib/upload-file";
import { Message } from "./Message";

export function MiddleSection() {
  const {
    msgs,
    setMsgs,
    streaming,
    setStreaming,
    files,
    setFiles,
    inputValue,
    setInputValue,
    error,
    setError,
    abortRef,
    scrollRef,
  } = useChatState();

  const { sendMessage } = useChatStream({
    msgs,
    setMsgs,
    files,
    setFiles,
    inputValue,
    setInputValue,
    streaming,
    setStreaming,
    abortRef,
    setError,
  });

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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

  // Handler khi bấm nút Summary News

  return (
    <Center flex="1" bg="#9ca3af38">
      <VStack gap="6" w="100%">
        <Heading size="3xl">What can I help with?</Heading>

        {/* Error message */}
        {error && <ErrorMessage error={error} />}

        {/* Conversation */}
        <Center w="100%">
          <VStack gap={4} align="stretch" maxW="768px" w="100%">
            {msgs
              .filter((msg) => msg.role !== "system")
              .map((msg, index) => (
                <Message msg={msg} index={index} streaming={streaming} />
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
                placeholder="Input message here"
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
              onClick={sendMessage}
              variant="solid"
            >
              <EnterIcon fontSize="4xl" />
            </IconButton>
          </Flex>
        </Center>

        {/* Prompt buttons */}
        {/* <PromptButtons onSummaryNews={() => handleSummaryNewsClick("vnexpress")} /> */}
      </VStack>
    </Center>
  );
}
