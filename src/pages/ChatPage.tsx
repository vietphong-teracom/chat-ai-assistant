import { useChatContext } from '@/context/chat-context';
import { ChatSection } from '@/middle-section';
import { Center } from '@chakra-ui/react';
import { useEffect } from 'react';

export function ChatPage() {
  const { forceScroll } = useChatContext();

  useEffect(() => {
    forceScroll();
  }, [forceScroll]);
  return (
    <Center minH='100vh' w='100%'>
      <ChatSection />
    </Center>
  );
}
