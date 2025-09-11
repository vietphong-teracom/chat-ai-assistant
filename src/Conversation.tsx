import { Center, VStack } from '@chakra-ui/react'
import { Message } from './Message'
import { ChatMsg } from './types'
import { ErrorMessage } from './ErrorMessage'

interface ConversationProps {
  msgs: ChatMsg[]
  streaming: boolean
  error: string | null
  scrollRef: React.RefObject<HTMLDivElement>
}

export function Conversation({ msgs, error, streaming, scrollRef }: ConversationProps) {
  return (
    <VStack gap={4} align='stretch' maxW='768px' w='100%'>
      {msgs
        .filter((msg) => msg.role !== 'system')
        .map((msg, index) => (
          <Message key={msg.content} msg={msg} index={index} streaming={streaming} />
        ))}
      {error && (
        <Center maxW='768px' w='100%'>
          <ErrorMessage error={error} />
        </Center>
      )}
      <div ref={scrollRef} />
    </VStack>
  )
}
