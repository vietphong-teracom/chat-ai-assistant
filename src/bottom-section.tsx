import { Box, Center } from '@chakra-ui/react';

export function BottomSection() {
  return (
    <Box mb={1} pt={2} bg={'#F6F6F6'}>
      <Center fontSize='xs' color='fg.muted'>
        Chatbot chỉ đóng vai trò như một trợ lý hỗ trợ. Không phải là nguồn chính xác tuyệt đối.
      </Center>
    </Box>
  );
}
