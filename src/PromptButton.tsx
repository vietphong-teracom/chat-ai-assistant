import { Box, HStack } from '@chakra-ui/react';
import { GrDocumentSound } from 'react-icons/gr';
import { Button } from './components/ui/button';
import { FiFileText } from 'react-icons/fi';
import { QuickPrompt } from './types';
import { FaRegFileAudio, FaRegNewspaper } from 'react-icons/fa';

interface PromptButtonProps {
  icon?: React.ReactElement;
  description: string;
  onClick?: () => void;
  disabled?: boolean;
}

function PromptButton({ icon, description, onClick, disabled }: PromptButtonProps) {
  return (
    <Button variant='outline' borderRadius='full' onClick={onClick} bg={'#f8f5f4'} disabled={disabled}>
      {icon}
      <Box>{description}</Box>
    </Button>
  );
}

interface PromptButtonsProps {
  onTriggerQuickPrompt: (quickPrompt: QuickPrompt) => void;
  onSummaryNews?: () => void;
}
export function PromptButtons({ onTriggerQuickPrompt, onSummaryNews }: PromptButtonsProps) {
  return (
    <HStack gap='4' mt={5} mb={8}>
      <PromptButton
        icon={<FaRegNewspaper color='#ce88f9ff' fontSize='lg' />}
        description='Cập Nhật Tin Tức'
        onClick={onSummaryNews}
      />
      <PromptButton
        icon={<FiFileText fontSize='lg' color='#eeb170ff' />}
        description='Tóm Tắt Văn Bản'
        onClick={() => onTriggerQuickPrompt(QuickPrompt.SUMMARY)}
      />
      <PromptButton
        icon={<GrDocumentSound color='#538336ff' fontSize='lg' />}
        description='Đọc Văn Bản'
        onClick={() => onTriggerQuickPrompt(QuickPrompt.TTS)}
      />

      <PromptButton
        icon={<FaRegFileAudio color='#3a7fec' fontSize='lg' />}
        description='Chuyển Âm Thanh Thành Văn Bản'
        onClick={() => onTriggerQuickPrompt(QuickPrompt.STT)}
      />
    </HStack>
  );
}
