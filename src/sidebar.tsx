import { Box, Circle, Flex, HStack, IconButton, Link, Stack, Text } from '@chakra-ui/react';
import { NavItem } from './components/NavItem';
import { Tooltip } from './components/ui/tooltip';
import { ExploreGPTIcon, NewChatIcon, SidebarIcon, SmallGPTIcon, UpgradeIcon } from './icons/sidebar-icons';
import { useSidebarContext } from './sidebar-context';

export function Sidebar() {
  const { sideBarVisible, toggleSidebar } = useSidebarContext();

  return (
    <Box
      bg='#15223a'
      color='white'
      w={!sideBarVisible ? '0' : '260px'}
      overflow='hidden'
      transition=' width 0.3s'
      position='fixed'
      h='100vh'
      zIndex={20} // 👈 đảm bảo nổi hơn nội dung
    >
      <Stack h='full' px='3' py='2'>
        <Flex justify='space-between'>
          <Tooltip content='Close sidebar' positioning={{ placement: 'right' }} showArrow>
            <IconButton variant='ghost' onClick={toggleSidebar}>
              <SidebarIcon fontSize='2xl' color='fg.muted' />
            </IconButton>
          </Tooltip>

          <Tooltip content='New chat' showArrow>
            <IconButton variant='ghost'>
              <NewChatIcon fontSize='2xl' color='fg.muted' />
            </IconButton>
          </Tooltip>
        </Flex>

        <Stack px='2' gap='3' flex='1'>
          <NavItem to='/' display='flex' alignItems='center' gap={3} px='1'>
            <Circle size='6' bg='bg' borderWidth='1px'>
              <SmallGPTIcon />
            </Circle>
            <Text fontSize='sm' fontWeight='md'>
              Chat AI
            </Text>
          </NavItem>

          <NavItem to='/guide' display='flex' alignItems='center' gap={3} px='1'>
            <ExploreGPTIcon />
            <Text fontSize='sm' fontWeight='md'>
              Hướng dẫn sử dụng
            </Text>
          </NavItem>
        </Stack>

        <Link
          href='#'
          _hover={{ textDecor: 'none', layerStyle: 'fill.muted' }}
          borderRadius='lg'
          px='1'
          py='2'
          bg='gray.200'
        >
          <HStack whiteSpace='nowrap'>
            <Circle size='8' fontSize='lg' borderWidth='1px'>
              <UpgradeIcon />
            </Circle>
            <Stack gap='0' fontWeight='medium'>
              <Text fontSize='xs' color='fg.subtle'>
                All Right Reserved
              </Text>
              <Text fontSize='xs' color='fg.subtle'>
                © Copyright 2025 Hitex Global
              </Text>
            </Stack>
          </HStack>
        </Link>
      </Stack>
    </Box>
  );
}
