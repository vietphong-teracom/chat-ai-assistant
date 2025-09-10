import {
  Box,
  Center,
  Flex,
  Heading,
  IconButton,
  VStack,
} from "@chakra-ui/react";
import {
  useEffect,
  useState,
  type KeyboardEvent,
  type SetStateAction,
} from "react";
import TextareaAutosize from "react-textarea-autosize";
import "../src/lib/index.css";
import { Conversation } from "./Conversation";
import { ErrorMessage } from "./ErrorMessage";
import { FilePreview } from "./FilePreview";
import { useChatState } from "./hooks/useChatState";
import { useChatStream } from "./hooks/useChatStream";
import { EnterIcon, UploadIcon } from "./icons/other-icons";
import { uploadFile } from "./lib/upload-file";
import { PromptButtons } from "./PromptButton";
import { ChatMsg } from "./types";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVolumeMute,
  FaVolumeUp,
} from "react-icons/fa";

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

  const { sendMessage, sendNewsSummary } = useChatStream({
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
        prev.map((f) =>
          f.previewUrl === previewUrl
            ? { ...f, fileId: data.id, uploading: false }
            : f
        )
      );
    }

    e.target.value = "";
  };

  // Handler khi bấm nút Summary News
  const handleSummaryNewsClick = async (feedKey = "vnexpress") => {
    if (streaming) return;
    setError(null);

    const userContent = "Tóm tắt tin tức mới nhất trong ngày";
    const userMsg: ChatMsg = { role: "user", content: userContent };

    // Append user message immediately to UI
    const nextMsgs = [...msgs, userMsg];
    setMsgs(nextMsgs);

    // Call the stream flow that will fetch RSS & call GPT
    // sendNewsSummary expects providedMsgs array including the user message
    sendNewsSummary(nextMsgs, feedKey);
  };

  const [isMicOn, setIsMicOn] = useState<boolean>(() => {
    const saved = localStorage.getItem("isMicOn");
    if (saved === "true") return true;
    return false; // mặc định false nếu chưa lưu
  });

  useEffect(() => {
    localStorage.setItem("isMicOn", String(isMicOn));
  }, [isMicOn]);

  const toggleMic = () => {
    setIsMicOn((prev) => !prev);
  };

  return (
    <Center flex="1" bg="#9ca3af38">
      <VStack gap="6" w="100%">
        <Heading size="3xl">What can I help with?</Heading>

        {/* Error message */}
        {error && <ErrorMessage error={error} />}

        {/* Conversation */}
        <Center w="100%">
          <Conversation
            msgs={msgs}
            streaming={streaming}
            scrollRef={scrollRef}
          />
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

            {/* Files Preview + textarea */}
            <VStack flex="1" align="stretch" gap={1}>
              <FilePreview files={files} setFiles={setFiles} />
              <TextareaAutosize
                minRows={1}
                maxRows={5}
                placeholder="Input message here"
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

            <IconButton
              aria-label="Toggle Microphone"
              size="sm"
              borderRadius="full"
              onClick={toggleMic}
              colorScheme={isMicOn ? "red" : "gray"}
              variant="outline"
            >
              {isMicOn ? <FaVolumeUp /> : <FaVolumeMute />}
            </IconButton>

            {/* Send */}
            <IconButton
              aria-label="Send message"
              size="sm"
              borderRadius="full"
              disabled={
                (inputValue.trim() === "" && files.length === 0) || streaming
              }
              onClick={sendMessage}
              variant="solid"
            >
              <EnterIcon fontSize="4xl" />
            </IconButton>
          </Flex>
        </Center>

        {/* Prompt buttons */}
        <PromptButtons
          onSummaryNews={() => handleSummaryNewsClick("vnexpress")}
        />
      </VStack>
    </Center>
  );
}
