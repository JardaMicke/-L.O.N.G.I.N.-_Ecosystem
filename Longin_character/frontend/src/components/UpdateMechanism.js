import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Text, 
  Progress, 
  Alert, 
  AlertIcon, 
  AlertTitle, 
  AlertDescription,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  VStack,
  HStack,
  Badge
} from '@chakra-ui/react';
import { FaDownload, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import ApiClient from '../utils/ApiClient';

const UpdateMechanism = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const apiClient = new ApiClient();

  useEffect(() => {
    checkForUpdates();
    // Check for updates every hour
    const interval = setInterval(checkForUpdates, 3600000);
    return () => clearInterval(interval);
  }, []);

  const checkForUpdates = async () => {
    try {
      setError(null);
      const response = await apiClient.get('/api/update/check');
      if (response.updateAvailable) {
        setUpdateAvailable(true);
        setUpdateInfo(response.updateInfo);
      }
    } catch (err) {
      console.error('Error checking for updates:', err);
      setError('Failed to check for updates');
    }
  };

  const downloadUpdate = async () => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);
      
      // Start the download
      const downloadId = await apiClient.post('/api/update/download');
      
      // Poll for progress
      const progressInterval = setInterval(async () => {
        const progressResponse = await apiClient.get(`/api/update/progress/${downloadId}`);
        setDownloadProgress(progressResponse.progress);
        
        if (progressResponse.status === 'completed') {
          clearInterval(progressInterval);
          setIsDownloading(false);
          promptInstall();
        } else if (progressResponse.status === 'error') {
          clearInterval(progressInterval);
          setIsDownloading(false);
          setError(progressResponse.error || 'Download failed');
        }
      }, 1000);
      
    } catch (err) {
      console.error('Error downloading update:', err);
      setIsDownloading(false);
      setError('Failed to download update');
    }
  };

  const promptInstall = () => {
    // In Electron, we can use ipcRenderer to communicate with the main process
    if (window.electron) {
      window.electron.send('install-update');
    } else {
      setError('Update downloaded but automatic installation is not available in this environment');
    }
  };

  // Display a small notification badge when updates are available
  if (updateAvailable && !isOpen) {
    return (
      <Button 
        position="fixed" 
        bottom="20px" 
        right="20px" 
        colorScheme="pink" 
        onClick={onOpen}
        size="sm"
        leftIcon={<FaDownload />}
      >
        Update Available
      </Button>
    );
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Software Update</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {error && (
              <Alert status="error" mb={4}>
                <AlertIcon />
                <AlertTitle>Error!</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {updateAvailable && updateInfo && (
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text fontSize="lg" fontWeight="bold">
                    Version {updateInfo.version} is available
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Current version: {updateInfo.currentVersion}
                  </Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" mb={2}>What's New:</Text>
                  <Box p={3} bg="gray.50" borderRadius="md">
                    {updateInfo.changelog.map((item, index) => (
                      <HStack key={index} mb={2}>
                        <Text as="span" fontSize="sm">•</Text>
                        <Text fontSize="sm">{item}</Text>
                      </HStack>
                    ))}
                  </Box>
                </Box>
                
                <HStack>
                  <Badge colorScheme="blue">Size: {updateInfo.size}</Badge>
                  <Badge colorScheme="green">Released: {new Date(updateInfo.releaseDate).toLocaleDateString()}</Badge>
                </HStack>
                
                {isDownloading && (
                  <Box>
                    <Text mb={2}>Downloading update... {downloadProgress}%</Text>
                    <Progress value={downloadProgress} size="sm" colorScheme="pink" />
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isDownloading}>
              Later
            </Button>
            {updateAvailable && !isDownloading && (
              <Button 
                colorScheme="pink" 
                leftIcon={<FaDownload />} 
                onClick={downloadUpdate}
                isLoading={isDownloading}
              >
                Download Update
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default UpdateMechanism;