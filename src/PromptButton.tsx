// src/PromptButton.tsx (hoặc file PromptButtons.tsx)
import { Box, HStack } from "@chakra-ui/react";
import "../src/lib/index.css";
import { Button } from "./components/ui/button";
import { IllustrationIcon } from "./icons/other-icons";

interface PromptButtonProps {
  icon?: React.ReactElement;
  description: string;
  onClick?: () => void;
}

function PromptButton({ icon, description, onClick }: PromptButtonProps) {
  return (
    <Button variant="outline" borderRadius="full" onClick={onClick} bg={"#f8f5f4"}>
      {icon}
      <Box ml={2}>{description}</Box>
    </Button>
  );
}

export function PromptButtons({ onSummaryNews }: { onSummaryNews?: () => void }) {
  return (
    <HStack gap="2" mb={6}>
      <PromptButton
        icon={<IllustrationIcon color="green.500" fontSize="lg" />}
        description="Summary News"
        onClick={onSummaryNews}
      />
      {/* <PromptButton icon={<CodeIcon color="blue.500" fontSize="lg" />} description="Code" />
      <PromptButton icon={<ChartIcon color="cyan.400" fontSize="lg" />} description="Analyze data" />
      <PromptButton icon={<BirthdayIcon color="cyan.400" fontSize="lg" />} description="Surprise" />
      <PromptButton description="More" /> */}
    </HStack>
  );
}
