import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom';
import { ChakraProvider, Spinner, Center, Box } from '@chakra-ui/react';
import theme from './theme';

// Use React.lazy for code splitting
const App = lazy(() => import('./App'));

// Loading component for Suspense
const Loading = () => (
  <Center h="100vh">
    <Spinner 
      thickness="4px"
      speed="0.65s"
      emptyColor="gray.200"
      color="pink.500"
      size="xl"
    />
  </Center>
);

ReactDOM.render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <Suspense fallback={<Loading />}>
        <App />
      </Suspense>
    </ChakraProvider>
  </React.StrictMode>,
  document.getElementById('root')
);