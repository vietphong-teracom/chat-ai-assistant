import { Box, Center, Flex, Heading, HStack, IconButton, VStack, Text, Spinner } from "@chakra-ui/react";
import { BirthdayIcon, ChartIcon, CodeIcon, EnterIcon, IllustrationIcon, UploadIcon } from "./icons/other-icons";
import { useState, useRef, useEffect } from "react";
import { Button } from "./components/ui/button";
import { API_KEY, API_URL, askStreamUnified, ChatMsg, UploadedFile } from "./lib/openai";
import { MarkdownMessage } from "./MarkdownMessage";
import type { KeyboardEvent, SetStateAction } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { getFileMeta } from "./helper";
import "../src/lib/index.css";

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

  // State quản lý file trước khi gửi
  const [files, setFiles] = useState<UploadedFile[]>([]);

  /** Gửi tin nhắn + file */
  const sendStream = async () => {
    if ((!inputValue.trim() && files.length === 0) || streaming) return;

    // 1. Gộp file vào message user
    const newUserMessage: ChatMsg = {
      role: "user",
      content: inputValue,
      files: files.map((f) => ({
        name: f.name,
        type: f.type,
        fileId: f.fileId!,
        previewUrl: f.previewUrl,
        size: f.size,
        uploading: f.uploading ?? false,
      })),
    };

    const nextMsgs = [...msgs, newUserMessage];
    setMsgs(nextMsgs);

    // Reset input và files
    setInputValue("");
    setFiles([]);
    setStreaming(true);

    // 2. Tạo AbortController
    const controller = new AbortController();
    abortRef.current = controller;

    // 3. Thêm message assistant trống để stream dữ liệu về
    setMsgs((prev) => [...prev, { role: "assistant", content: "" }]);

    // 4. Callback append delta trực tiếp vào state
    const onDelta = (delta: string) => {
      setMsgs((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last && last.role === "assistant") {
          copy[copy.length - 1] = {
            ...last,
            content: last.content + delta,
          };
        }
        return copy;
      });
    };

    try {
      await askStreamUnified(nextMsgs, onDelta, files, "gpt-4o-mini", controller.signal);
    } catch (err) {
      console.error("Error streaming:", err);
    } finally {
      // 6. Reset trạng thái streaming
      setStreaming(false);
      abortRef.current = null;
    }
  };

  /** Gửi bằng phím Enter */
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendStream();
    }
  };

  /** Tự động cuộn xuống cuối khi có message mới */
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  /** Upload file lên OpenAI */
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

      try {
        const res = await fetch(`${API_URL}/files`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${API_KEY}`,
          },
          body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();

        // 3. Cập nhật lại fileId và chuyển uploading thành false
        setFiles((prev) =>
          prev.map((f) => (f.previewUrl === previewUrl ? { ...f, fileId: data.id, uploading: false } : f))
        );
      } catch (err) {
        console.error("Error uploading file:", err);
        // Nếu lỗi thì xóa file này
        setFiles((prev) => prev.filter((f) => f.previewUrl !== previewUrl));
      }
    }

    e.target.value = "";
  };

  /** Xóa file trong queue trước khi gửi */
  const removeFile = async (index: number) => {
    try {
      const fileToDelete = files[index];
      if (!fileToDelete?.fileId) {
        // Nếu chưa upload xong thì chỉ xóa local
        setFiles((prev) => prev.filter((_, i) => i !== index));
        return;
      }

      const res = await fetch(`${API_URL}/files/${fileToDelete.fileId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Xóa file thất bại: ${errText}`);
      }

      setFiles((prev) => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error(error);
    }
  };

  /** Render file đã gửi trong mỗi message */
  const renderMessageFiles = (messageFiles?: UploadedFile[]) => {
    if (!messageFiles || messageFiles.length === 0) return null;

    return (
      <VStack align="stretch" gap={2} mt={2}>
        {messageFiles.map((file, index) => {
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
                    width: 60,
                    height: 60,
                    objectFit: "cover",
                    borderRadius: "8px",
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
                <Text fontSize="sm" fontWeight="bold" whiteSpace="nowrap" textOverflow="ellipsis" overflow="hidden">
                  {file.name}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {ext.toUpperCase()}
                </Text>
              </Flex>
            </Flex>
          );
        })}
      </VStack>
    );
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
                  {/* Nội dung text */}
                  {m.content ? (
                    <MarkdownMessage content={m.content} />
                  ) : m.role === "assistant" && streaming ? (
                    // Hiển thị animation 3 chấm khi assistant đang trả lời
                    <Box className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </Box>
                  ) : null}

                  {/* Files đính kèm trong message */}
                  {m.files && renderMessageFiles(m.files as UploadedFile[])}
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
                            onClick={() => removeFile(index)}
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
