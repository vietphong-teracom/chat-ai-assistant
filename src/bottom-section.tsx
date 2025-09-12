import { Box, Center } from '@chakra-ui/react';

export function BottomSection() {
  return (
    <Box pb='1' mt={1} mb={1}>
      <Center fontSize='xs' color='fg.muted'>
        Chatbot đóng vài trò là một trợ lý hỗ trợ. Không phải là nguồn chính xác tuyệt đối.
      </Center>
    </Box>
  );
}
