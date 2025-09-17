import { useChatState } from '@/hooks/useChatState';
import { createContext, useContext } from 'react';

const ChatContext = createContext<ReturnType<typeof useChatState> | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const chat = useChatState();
  return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
  return ctx;
}
