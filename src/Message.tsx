import { Box } from '@chakra-ui/react';
import { MarkdownMessage } from './MarkdownMessage';
import { ThinkingMessage } from './ThinkingMessage';
import { FileMessages } from './FileMessage';
import { ChatMsg } from './types';
import { AudioMessage } from './AudioMessage';

type MessageProps = {
  msg: ChatMsg;
  index: number;
  streaming: boolean;
};

export const Message = ({ msg, index, streaming }: MessageProps) => {
  const showThinking = msg.role === 'assistant' && streaming && !msg.content && !msg.audioUrl;

  return (
    <Box
      key={index}
      alignSelf={msg.role === 'user' ? 'flex-end' : 'flex-start'}
      px={4}
      py={3}
      borderRadius='xl'
      bg={msg.role === 'user' ? '#f7f6f1' : '#ffffff'}
      color={'#111111'}
      fontSize='15px'
      lineHeight='1.6'
      boxShadow='sm'
    >
      {showThinking && <ThinkingMessage />}
      {Boolean(msg.displayContent) && <MarkdownMessage content={msg.displayContent || msg.content} />}
      {Boolean(msg.files) && <FileMessages files={msg.files} />}
      {Boolean(msg.audioUrl) && <AudioMessage audioUrl={msg.audioUrl} />}
    </Box>
  );
};
