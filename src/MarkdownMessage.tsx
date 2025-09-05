import { Box, Text } from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypePrism from "rehype-prism-plus";
import { Components } from "react-markdown";
import "prismjs/themes/prism-tomorrow.css"; // hoặc prism.css nếu thích sáng

interface MarkdownMessageProps {
  content: string;
}

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  // custom render cho các tag markdown
  const components: Components = {
    p: ({ children }) => <Text mb={2}>{children}</Text>,
    strong: ({ children }) => (
      <Text as="span" fontWeight="bold">
        {children}
      </Text>
    ),
    em: ({ children }) => (
      <Text as="span" fontStyle="italic">
        {children}
      </Text>
    ),
    code({ node, inline, className, children, ...props }: any) {
      if (inline) {
        return (
          <Box as="code" bg="gray.100" px={1} borderRadius="sm" fontFamily="mono" {...props}>
            {children}
          </Box>
        );
      }

      // code block (dùng ```lang)
      return (
        <Box as="pre" bg="gray.900" color="gray.100" p={4} borderRadius="md" overflowX="auto" mb={3}>
          <code className={className} {...props}>
            {children}
          </code>
        </Box>
      );
    },
  };

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypePrism]} components={components}>
      {content}
    </ReactMarkdown>
  );
}
