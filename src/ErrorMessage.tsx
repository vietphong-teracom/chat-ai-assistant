import { Alert } from "@chakra-ui/react";

export const ErrorMessage = ({ error }: { error: string }) => {
  return (
    <Alert.Root status="error" borderRadius="md">
      <Alert.Indicator />
      <Alert.Title>Error:</Alert.Title>
      <Alert.Description>{error}</Alert.Description>
    </Alert.Root>
  );
};
