import { Box, Flex, Text, VStack } from '@chakra-ui/react';
import '../src/lib/index.css';
import { getFileMeta } from './helper';
import { UploadedFile } from './types';
import { QUICK_PROMPT } from './const';

type FileMessageProp = {
  files?: UploadedFile[];
};

export function FileMessages({ files }: FileMessageProp) {
  if (!files || files.length === 0) return null;

  return (
    <VStack align='stretch' gap={2} mt={2}>
      {files.map((file, index) => {
        const ext = file.fileName.split('.').pop() || '';
        const { color, icon } = getFileMeta(ext);

        return (
          <Box key={file.filePreviewUrl}>
            {file.filePrompt && (
              <Text fontSize='sm' fontWeight='medium' color='gray.700'>
                {QUICK_PROMPT[file.filePrompt]}
              </Text>
            )}
            <Flex
              key={index}
              align='center'
              border='1px solid #e2e2e2'
              borderRadius='lg'
              px={2}
              py={2}
              bg='gray.50'
              gap={3}
              w='fit-content'
            >
              {/* Nếu là ảnh → preview thumbnail */}
              {file.fileType.startsWith('image/') ? (
                <img
                  src={file.filePreviewUrl || ''}
                  alt={file.fileName}
                  style={{
                    width: 60,
                    height: 60,
                    objectFit: 'cover',
                    borderRadius: '8px',
                  }}
                />
              ) : (
                <Box
                  w='36px'
                  h='36px'
                  display='flex'
                  alignItems='center'
                  justifyContent='center'
                  borderRadius='md'
                  bg={color}
                  color='white'
                  fontSize='18px'
                  flexShrink={0}
                >
                  {icon}
                </Box>
              )}

              {/* Info */}
              <Flex direction='column' flex='1' minW={0}>
                <Text fontSize='sm' fontWeight='bold' whiteSpace='nowrap' textOverflow='ellipsis' overflow='hidden'>
                  {file.fileName}
                </Text>
                <Text fontSize='xs' color='gray.500'>
                  {ext.toUpperCase()}
                </Text>
              </Flex>
            </Flex>
          </Box>
        );
      })}
    </VStack>
  );
}
