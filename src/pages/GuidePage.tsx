import { Box, Heading, Text } from '@chakra-ui/react';

export function GuidePage() {
  return (
    <Box p={6}>
      <Heading size='lg' mb={4}>
        Guide Page
      </Heading>
      <Text fontSize='md'>Đây là trang hướng dẫn. Bạn có thể thêm nội dung chi tiết ở đây.</Text>
    </Box>
  );
}
