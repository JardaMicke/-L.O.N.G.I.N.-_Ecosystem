import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, Flex, useColorMode, useToast } from '@chakra-ui/react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import PerformanceMonitor from './utils/PerformanceMonitor';
import UpdateMechanism from './components/UpdateMechanism';
import UpdateButton from './components/UpdateButton';
import { UpdateProvider } from './contexts/UpdateContext';

// Lazy load pages for code splitting
const CharactersPage = lazy(() => import('./pages/CharactersPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const RolePlayingPage = lazy(() => import('./pages/RolePlayingPage'));

// Loading component
const PageLoader = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="calc(100vh - 80px)"
  >
    <Box
      width="60px"
      height="60px"
      border="4px solid transparent"
      borderTopColor="pink.500"
      borderRadius="50%"
      animation="spin 1s linear infinite"
      sx={{
        '@keyframes spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        }
      }}
    />
  </Box>
);

function App() {
  const { colorMode } = useColorMode();
  const [isLoaded, setIsLoaded] = useState(false);
  const toast = useToast();
  
  // Initialize performance monitoring
  useEffect(() => {
    // Start performance monitoring
    PerformanceMonitor.init();
    
    // Simulate checking critical resources
    const timer = setTimeout(() => {
      setIsLoaded(true);
      
      // Log initial performance metrics
      const metrics = PerformanceMonitor.getMetrics();
      console.log('Initial performance metrics:', metrics);
      
      // Notify if performance is below thresholds
      if (metrics.loadTime > 3000) {
        toast({
          title: 'Performance Alert',
          description: 'Application load time is higher than expected. Some features may be slower.',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      }
    }, 1000);
    
    return () => {
      clearTimeout(timer);
      PerformanceMonitor.stop();
    };
  }, [toast]);
  
  if (!isLoaded) {
    return <PageLoader />;
  }
  
  return (
    <UpdateProvider>
      <Router>
        <Flex 
          direction="column" 
          h="100vh"
          bg={colorMode === 'dark' ? 'gray.800' : 'gray.50'}
        >
          <Header />
          <Flex flex="1" overflow="hidden">
            <Sidebar />
            <Box 
              flex="1" 
              p={4} 
              overflowY="auto"
              className="main-content"
            >
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/characters" element={<CharactersPage />} />
                  <Route path="/chat/:conversationId" element={<ChatPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/role-playing" element={<RolePlayingPage />} />
                  <Route path="/" element={<Navigate to="/characters" replace />} />
                </Routes>
              </Suspense>
            </Box>
          </Flex>
          <Box position="fixed" bottom="20px" right="20px" zIndex="1000">
            <UpdateButton size="md" />
          </Box>
        </Flex>
        <UpdateMechanism />
      </Router>
    </UpdateProvider>
  );
}

export default App;