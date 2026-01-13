import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  useToast,
  Text,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Progress,
  useColorMode,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { DownloadIcon, UploadIcon, InfoIcon } from '@chakra-ui/icons';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const ExportImport = ({ isOpen, onClose, onSuccess, characterId = null }) => {
  const { colorMode } = useColorMode();
  const toast = useToast();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportData, setExportData] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  
  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setExportData(null);
      setImportFile(null);
      setAvatarFile(null);
      setProgress(0);
    }
  }, [isOpen]);
  
  // Export character data
  const handleExport = async () => {
    if (!characterId) {
      toast({
        title: 'Chyba',
        description: 'Není vybrána žádná postava k exportu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setLoading(true);
    setProgress(10);
    
    try {
      const response = await axios.get(`${API_URL}/characters/${characterId}/export`);
      setExportData(response.data);
      setProgress(100);
      
      // Create and download file
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${response.data.character.name.replace(/\s+/g, '_')}_export.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Export dokončen',
        description: `Postava ${response.data.character.name} byla úspěšně exportována`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error exporting character:', error);
      toast({
        title: 'Chyba při exportu',
        description: error.response?.data?.error || 'Nastala chyba při exportu postavy',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle file selection for import
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setImportFile(e.target.files[0]);
    }
  };
  
  // Handle avatar file selection
  const handleAvatarChange = (e) => {
    if (e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };
  
  // Import character data
  const handleImport = async () => {
    if (!importFile) {
      toast({
        title: 'Chyba',
        description: 'Vyberte soubor k importu',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setLoading(true);
    setProgress(10);
    
    try {
      // Read file content
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          setProgress(30);
          
          // Create form data for upload
          const formData = new FormData();
          formData.append('characterData', JSON.stringify(data));
          
          if (avatarFile) {
            formData.append('avatar', avatarFile);
          }
          
          setProgress(50);
          
          // Send import request
          const response = await axios.post(`${API_URL}/characters/import`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          
          setProgress(100);
          
          toast({
            title: 'Import dokončen',
            description: `Postava ${response.data.character.name} byla úspěšně importována`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          
          // Notify parent component
          if (onSuccess) {
            onSuccess(response.data.character);
          }
          
          // Close modal
          onClose();
        } catch (error) {
          console.error('Error parsing or importing character:', error);
          toast({
            title: 'Chyba při importu',
            description: error.response?.data?.error || 'Neplatný formát souboru nebo chyba při importu',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        } finally {
          setLoading(false);
        }
      };
      
      fileReader.readAsText(importFile);
    } catch (error) {
      console.error('Error reading file:', error);
      setLoading(false);
      toast({
        title: 'Chyba při čtení souboru',
        description: 'Nastala chyba při čtení souboru',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Export / Import postavy</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Export Section */}
            <Box 
              p={5} 
              borderWidth="1px" 
              borderRadius="md" 
              borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
            >
              <Text fontSize="lg" fontWeight="bold" mb={3}>
                <Icon as={DownloadIcon} mr={2} />
                Export postavy
              </Text>
              
              <Text mb={4}>
                Exportujte postavu včetně všech vzpomínek a vztahů do souboru JSON.
              </Text>
              
              <Button 
                leftIcon={<DownloadIcon />} 
                colorScheme="brand" 
                onClick={handleExport} 
                isLoading={loading && !importFile}
                isDisabled={!characterId}
                w="full"
              >
                Exportovat postavu
              </Button>
              
              {loading && !importFile && (
                <Progress value={progress} size="sm" colorScheme="brand" mt={4} />
              )}
              
              {!characterId && (
                <Alert status="info" mt={4} size="sm">
                  <AlertIcon />
                  Nejprve vyberte postavu, kterou chcete exportovat
                </Alert>
              )}
            </Box>
            
            {/* Import Section */}
            <Box 
              p={5} 
              borderWidth="1px" 
              borderRadius="md" 
              borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
            >
              <Text fontSize="lg" fontWeight="bold" mb={3}>
                <Icon as={UploadIcon} mr={2} />
                Import postavy
              </Text>
              
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel>Soubor s postavou (.json)</FormLabel>
                  <Input
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Vlastní avatar (volitelné)</FormLabel>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </FormControl>
                
                <Button 
                  leftIcon={<UploadIcon />} 
                  colorScheme="green" 
                  onClick={handleImport} 
                  isLoading={loading && !!importFile}
                  isDisabled={!importFile}
                  w="full"
                >
                  Importovat postavu
                </Button>
                
                {loading && importFile && (
                  <Progress value={progress} size="sm" colorScheme="green" mt={2} />
                )}
              </VStack>
            </Box>
            
            <Alert status="info">
              <AlertIcon />
              <Text fontSize="sm">
                Importovaná postava bude mít nové ID. Všechny existující konverzace zůstanou přiřazeny původní postavě.
              </Text>
            </Alert>
          </VStack>
        </ModalBody>
        
        <ModalFooter>
          <Button onClick={onClose}>Zavřít</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ExportImport;