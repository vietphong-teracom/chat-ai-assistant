import { Box, Center, Flex, Heading, IconButton, VStack } from '@chakra-ui/react';
import { useRef, type KeyboardEvent, type SetStateAction } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import '../src/lib/index.css';
import { Conversation } from './Conversation';
import { FilePreview } from './FilePreview';
import { useChatState } from './hooks/useChatState';
import { useChatStream } from './hooks/useChatStream';
import { EnterIcon, UploadIcon } from './icons/other-icons';
import { PromptButtons } from './PromptButton';
import { QuickPrompt } from './types';
import { VoiceRecorder } from './VoiceRecorder';

export function MiddleSection() {
  const {
    msgs,
    setMsgs,
    inputValue,
    setInputValue,
    files,
    setFiles,
    streaming,
    setStreaming,
    error,
    setError,
    abortRef,
    scrollRef,
    quickPrompt,
    setQuickPrompt,
  } = useChatState();

  const { chatQaA, summaryDocument, ttsDocument, summaryNews, sttDocument } = useChatStream({
    msgs,
    setMsgs,
    inputValue,
    setInputValue,
    files,
    setFiles,
    streaming,
    setStreaming,
    abortRef,
    setError,
  });

  const quickPromptInputRef = useRef<HTMLInputElement | null>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatQaA();
    }
  };

  const handleSelectForInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);
    const fileInfoList = selectedFiles.map((file) => ({
      rawFile: file,
      name: file.name,
      size: file.size,
      type: file.type,
      previewUrl: URL.createObjectURL(file),
    }));
    setFiles(fileInfoList);
    e.target.value = '';
  };

  const handleSelectFileForQuickPrompt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);
    const file = selectedFiles[0];
    if (!file) return;

    if (quickPrompt === QuickPrompt.SUMMARY) {
      summaryDocument(file);
    }
    if (quickPrompt === QuickPrompt.TTS) {
      ttsDocument(file);
    }
    if (quickPrompt === QuickPrompt.STT) {
      sttDocument(file);
    }

    e.target.value = '';
  };

  const triggerSelectFile = (quickPrompt: QuickPrompt) => {
    quickPromptInputRef.current?.click();
    setQuickPrompt(quickPrompt);
  };

  return (
    <Center flex='1' bg='#9ca3af38'>
      <VStack gap='6' w='100%'>
        <Heading size='3xl' mb={2}>
          Tôi có thể giúp gì cho bạn?
        </Heading>

        {/* Conversation */}
        <Center w='100%'>
          <Conversation msgs={msgs} streaming={streaming} error={error} scrollRef={scrollRef} />
        </Center>

        {/* Input */}
        <Center w='100%'>
          <Flex
            maxW='768px'
            w='100%'
            borderRadius='3xl'
            border='1px solid #ccc'
            p={2}
            align='center'
            gap={2}
            bg='white'
          >
            {/* Upload */}
            <Box w='40px' flexShrink={0}>
              <input type='file' id='file-input' style={{ display: 'none' }} multiple onChange={handleSelectForInput} />
              <label htmlFor='file-input'>
                <IconButton
                  aria-label='Upload file'
                  size='sm'
                  borderRadius='full'
                  variant='ghost'
                  as='span'
                  w='100%'
                  h='100%'
                >
                  <UploadIcon fontSize='2xl' />
                </IconButton>
              </label>
            </Box>

            {/* Files Preview + textarea */}
            <VStack flex='1' align='stretch' gap={1}>
              <FilePreview files={files} setFiles={setFiles} />
              <TextareaAutosize
                minRows={1}
                maxRows={5}
                placeholder='Vui lòng nhập yêu cầu'
                value={inputValue}
                onChange={(e: { target: { value: SetStateAction<string> } }) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                  width: '100%',
                  borderRadius: '24px',
                  padding: '6px 10px',
                  resize: 'none',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                }}
              />
            </VStack>

            {/* input file cho Đọc Văn Bản */}
            <input
              type='file'
              accept='.pdf, .mp3, .mp4, application/pdf, audio/mpeg, video/mp4'
              ref={quickPromptInputRef}
              style={{ display: 'none' }}
              onChange={handleSelectFileForQuickPrompt}
            />
            <VoiceRecorder setInputValue={setInputValue} setError={setError} />
            {/* Send */}
            <IconButton
              aria-label='Send message'
              size='sm'
              borderRadius='full'
              disabled={(inputValue.trim() === '' && files.length === 0) || streaming}
              onClick={chatQaA}
              variant='solid'
            >
              <EnterIcon fontSize='4xl' />
            </IconButton>
          </Flex>
        </Center>

        {/* Prompt buttons */}
        <PromptButtons onTriggerQuickPrompt={triggerSelectFile} onSummaryNews={summaryNews} />
      </VStack>
    </Center>
  );
}
