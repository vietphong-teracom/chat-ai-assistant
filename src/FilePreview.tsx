import { Box, Flex, IconButton, Spinner, Text, VStack } from '@chakra-ui/react'
import { getFileMeta } from './helper'
import { removeFile } from './lib/remove-file-uploaded'
import { UploadedFile } from './types'

type FilePreviewProps = {
  files: UploadedFile[]
  setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>
}

export function FilePreview({ files, setFiles }: FilePreviewProps) {
  return (
    <>
      {files.length > 0 && (
        <VStack align='stretch' gap={2}>
          {files.map((file, index) => {
            const ext = file.fileName.split('.').pop() || ''
            const { color, icon } = getFileMeta(ext)

            return (
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
                      width: 50,
                      height: 50,
                      objectFit: 'cover',
                      borderRadius: '6px',
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

                {/* Nếu đang upload → Spinner */}
                {file.uploading ? (
                  <Spinner size='sm' color='blue.500' />
                ) : (
                  <IconButton
                    aria-label='Remove file'
                    size='xs'
                    variant='ghost'
                    onClick={() => removeFile({ files, setFiles, index })}
                  >
                    ✕
                  </IconButton>
                )}
              </Flex>
            )
          })}
        </VStack>
      )}
    </>
  )
}
