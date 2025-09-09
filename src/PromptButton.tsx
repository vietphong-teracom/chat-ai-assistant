import { Box, HStack } from "@chakra-ui/react";
import "../src/lib/index.css";
import { Button } from "./components/ui/button";
import { BirthdayIcon, ChartIcon, CodeIcon, IllustrationIcon } from "./icons/other-icons";

interface PromptButtonProps {
  icon?: React.ReactElement;
  description: string;
}

function PromptButton(props: PromptButtonProps) {
  const { icon, description } = props;
  return (
    <Button variant="outline" borderRadius="full">
      {icon}
      <Box ml={2}>{description}</Box>
    </Button>
  );
}

export function PromptButtons() {
  return (
    <HStack gap="2">
      <PromptButton icon={<IllustrationIcon color="green.500" fontSize="lg" />} description="Create image" />
      <PromptButton icon={<CodeIcon color="blue.500" fontSize="lg" />} description="Code" />
      <PromptButton icon={<ChartIcon color="cyan.400" fontSize="lg" />} description="Analyze data" />
      <PromptButton icon={<BirthdayIcon color="cyan.400" fontSize="lg" />} description="Surprise" />
      <PromptButton description="More" />
    </HStack>
  );
}
