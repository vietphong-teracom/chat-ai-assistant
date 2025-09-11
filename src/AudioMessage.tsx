import { Box } from "@chakra-ui/react";

export const AudioMessage = ({ audioUrl }: { audioUrl?: string }) => {
  return (
    <Box mt={2}>
      <audio controls src={audioUrl} style={{ maxWidth: "100%" }} />
    </Box>
  );
};
