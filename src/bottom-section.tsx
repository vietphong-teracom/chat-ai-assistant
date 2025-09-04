import { Box, Center } from "@chakra-ui/react";

export function BottomSection() {
  return (
    <Box pb="2" mt={4} mb={1}>
      <Center fontSize="xs" color="fg.muted">
        ChatGPT can make mistakes. Check important info.
      </Center>
    </Box>
  );
}
