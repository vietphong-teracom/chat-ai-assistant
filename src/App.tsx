import { Box, Flex, Stack } from '@chakra-ui/react';
import { Sidebar } from './sidebar';
import { SidebarProvider } from './sidebar-context';
import { TopSection } from './top-section';
import { BottomSection } from './bottom-section';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ChatPage } from './pages/ChatPage';
import { GuidePage } from './pages/GuidePage';
import { ChatProvider } from './context/chat-context';
import './styles/index.css';

function App() {
  return (
    <BrowserRouter>
      <SidebarProvider>
        <ChatProvider>
          <Flex minH='100dvh'>
            <Sidebar />
            <Box flex='1'>
              <Stack h='full'>
                <TopSection />
                <Box flex='1' overflow='auto'>
                  <Routes>
                    <Route path='/' element={<ChatPage />} />
                    <Route path='/guide' element={<GuidePage />} />
                  </Routes>
                </Box>
                <BottomSection />
              </Stack>
            </Box>
          </Flex>
        </ChatProvider>
      </SidebarProvider>
    </BrowserRouter>
  );
}

export default App;
