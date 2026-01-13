import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorMode,
  Button,
  Text,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Switch,
  Select,
  Divider,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Card,
  CardHeader,
  CardBody,
  Badge,
  useToast,
  Flex,
  Spinner
} from '@chakra-ui/react';
import { SunIcon, MoonIcon, RepeatIcon, CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import Achievements from '../components/Achievements';
import UpdateSettings from '../components/UpdateSettings';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const ModelCard = ({ model, isActive, onSelect, isLoading }) => {
  const { colorMode } = useColorMode();
  
  return (
    <Card 
      variant="outline" 
      mb={4}
      cursor="pointer"
      onClick={() => !isLoading && onSelect(model.id)}
      bg={isActive ? (colorMode === 'dark' ? 'purple.800' : 'purple.50') : undefined}
      borderWidth={isActive ? '2px' : '1px'}
      borderColor={isActive ? 'purple.500' : undefined}
      opacity={!model.status.available && !isLoading ? 0.6 : 1}
      position="relative"
    >
      {isLoading && (
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg={colorMode === 'dark' ? 'blackAlpha.600' : 'whiteAlpha.800'}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius="md"
          zIndex="10"
        >
          <Spinner size="xl" color="purple.500" />
        </Box>
      )}
      
      <CardHeader pb={0}>
        <Flex justify="space-between" align="center">
          <Heading size="md" color={isActive ? 'purple.500' : undefined}>{model.name}</Heading>
          <HStack>
            {model.status.loading && <Spinner size="sm" />}
            <Badge colorScheme={model.status.available ? 'green' : 'red'}>
              {model.status.available ? 'Available' : 'Not Loaded'}
            </Badge>
            {isActive && <CheckCircleIcon color="green.500" />}
          </HStack>
        </Flex>
      </CardHeader>
      
      <CardBody>
        <Text mb={2}>{model.description}</Text>
        <HStack mb={2}>
          <Badge colorScheme="blue">{model.parameters}</Badge>
          <Badge colorScheme="red">{model.category}</Badge>
        </HStack>
        
        <Box mt={3}>
          <Text fontSize="sm" fontWeight="bold">Strengths:</Text>
          <Flex mt={1} wrap="wrap" gap={1}>
            {model.strengths.map((strength, index) => (
              <Badge key={index} colorScheme="teal" variant="outline">
                {strength}
              </Badge>
            ))}
          </Flex>
        </Box>
      </CardBody>
    </Card>
  );
};

const SettingsPage = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();
  
  // State for app settings
  const [settings, setSettings] = useState({
    activeModel: 'dolphin-mistral',
    voiceEnabled: true,
    nsfw: true,
    imageQuality: 'medium',
    temperature: 0.7,
    topP: 0.9,
    memoryEnabled: true
  });
  
  // State for models
  const [models, setModels] = useState([]);
  const [loadingModel, setLoadingModel] = useState(null);
  
  // Fetch settings and models on component mount
  useEffect(() => {
    fetchSettings();
    fetchModels();
  }, []);
  
  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings`);
      setSettings(prevSettings => ({
        ...prevSettings,
        ...response.data
      }));
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };
  
  const fetchModels = async () => {
    try {
      const response = await axios.get(`${API_URL}/models`);
      setModels(response.data);
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };
  
  const handleSettingChange = async (setting, value) => {
    setSettings({
      ...settings,
      [setting]: value
    });
    
    try {
      if (setting === 'temperature' || setting === 'topP') {
        // Update model options
        await axios.post(`${API_URL}/models/options`, {
          temperature: setting === 'temperature' ? value : undefined,
          topP: setting === 'topP' ? value : undefined
        });
      } else if (setting === 'voiceEnabled' || setting === 'nsfw') {
        // Update user settings
        await axios.post(`${API_URL}/settings`, {
          voiceEnabled: setting === 'voiceEnabled' ? value : undefined,
          nsfwEnabled: setting === 'nsfw' ? value : undefined
        });
      }
    } catch (error) {
      console.error(`Error updating setting ${setting}:`, error);
      toast({
        title: 'Error updating setting',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };
  
  const handleModelSelect = async (modelId) => {
    try {
      setLoadingModel(modelId);
      
      // Switch to the selected model
      const response = await axios.post(`${API_URL}/models/switch`, { modelId });
      
      // Update settings with new model and temperature
      setSettings({
        ...settings,
        activeModel: modelId,
        temperature: response.data.model.options.temperature,
        topP: response.data.model.options.topP
      });
      
      // Update models status
      setModels(prevModels => prevModels.map(model => ({
        ...model,
        status: {
          ...model.status,
          available: model.id === modelId ? true : model.status.available
        }
      })));
      
      toast({
        title: 'Model switched',
        description: `Now using ${response.data.model.name}`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      console.error('Error switching model:', error);
      toast({
        title: 'Error switching model',
        description: error.response?.data?.error || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoadingModel(null);
    }
  };
  
  const refreshModelsStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/models`);
      setModels(response.data);
      
      toast({
        title: 'Models refreshed',
        status: 'info',
        duration: 2000,
        isClosable: true
      });
    } catch (error) {
      console.error('Error refreshing models:', error);
    }
  };
  
  return (
    <Box p={4}>
      <Heading size="lg" mb={6}>Nastavení</Heading>
      
      <Tabs variant="enclosed" colorScheme="brand">
        <TabList>
          <Tab>Obecné</Tab>
          <Tab>AI Modely</Tab>
          <Tab>Úspěchy</Tab>
          <Tab>Aktualizace</Tab>
          <Tab>O aplikaci</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
            <Card variant="outline" mb={4}>
              <CardHeader>
                <Heading size="md">Vzhled</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="start" spacing={4}>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel mb="0">
                      Tmavý režim
                    </FormLabel>
                    <Button 
                      onClick={toggleColorMode}
                      leftIcon={colorMode === 'dark' ? <SunIcon /> : <MoonIcon />}
                      variant="outline"
                      size="sm"
                    >
                      {colorMode === 'dark' ? 'Přepnout na světlý' : 'Přepnout na tmavý'}
                    </Button>
                  </FormControl>
                </VStack>
              </CardBody>
            </Card>
            
            <Card variant="outline" mb={4}>
              <CardHeader>
                <Heading size="md">Audio nastavení</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="start" spacing={4}>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel mb="0">
                      Text na řeč
                    </FormLabel>
                    <Switch 
                      colorScheme="brand"
                      isChecked={settings.voiceEnabled}
                      onChange={(e) => handleSettingChange('voiceEnabled', e.target.checked)}
                    />
                  </FormControl>
                </VStack>
              </CardBody>
            </Card>
            
            <Card variant="outline">
              <CardHeader>
                <Heading size="md">Obsah</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="start" spacing={4}>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel mb="0">
                      NSFW obsah
                    </FormLabel>
                    <Switch 
                      colorScheme="brand"
                      isChecked={settings.nsfw}
                      onChange={(e) => handleSettingChange('nsfw', e.target.checked)}
                    />
                  </FormControl>
                  
                  <FormControl display="flex" alignItems="center">
                    <FormLabel mb="0">
                      Pamět postavy
                    </FormLabel>
                    <Switch 
                      colorScheme="brand"
                      isChecked={settings.memoryEnabled}
                      onChange={(e) => handleSettingChange('memoryEnabled', e.target.checked)}
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>
                      Kvalita generovaných obrázků
                    </FormLabel>
                    <Select 
                      value={settings.imageQuality}
                      onChange={(e) => handleSettingChange('imageQuality', e.target.value)}
                    >
                      <option value="low">Nízká (rychlejší)</option>
                      <option value="medium">Střední</option>
                      <option value="high">Vysoká (pomalejší)</option>
                    </Select>
                  </FormControl>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>
          
          <TabPanel>
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="md">Dostupné AI modely</Heading>
              <Button 
                leftIcon={<RepeatIcon />} 
                onClick={refreshModelsStatus}
                size="sm"
                colorScheme="blue"
              >
                Obnovit
              </Button>
            </Flex>
            
            {models.map(model => (
              <ModelCard 
                key={model.id}
                model={model}
                isActive={settings.activeModel === model.id}
                onSelect={handleModelSelect}
                isLoading={loadingModel === model.id}
              />
            ))}
            
            <Card variant="outline" mt={6}>
              <CardHeader>
                <Heading size="md">Nastavení modelu</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="start" spacing={6}>
                  <FormControl>
                    <FormLabel>Kreativita odpovědí (teplota)</FormLabel>
                    <Slider 
                      value={settings.temperature} 
                      min={0} 
                      max={1} 
                      step={0.1}
                      onChange={(value) => handleSettingChange('temperature', value)}
                      colorScheme="brand"
                    >
                      <SliderTrack>
                        <SliderFilledTrack />
                      </SliderTrack>
                      <SliderThumb />
                    </Slider>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Přesné</Text>
                      <Text fontSize="sm" fontWeight="bold">{settings.temperature}</Text>
                      <Text fontSize="sm">Kreativní</Text>
                    </HStack>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Rozmanitost (Top P)</FormLabel>
                    <Slider 
                      value={settings.topP} 
                      min={0} 
                      max={1} 
                      step={0.1}
                      onChange={(value) => handleSettingChange('topP', value)}
                      colorScheme="brand"
                    >
                      <SliderTrack>
                        <SliderFilledTrack />
                      </SliderTrack>
                      <SliderThumb />
                    </Slider>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Konzistentní</Text>
                      <Text fontSize="sm" fontWeight="bold">{settings.topP}</Text>
                      <Text fontSize="sm">Rozmanité</Text>
                    </HStack>
                  </FormControl>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>
          
          <TabPanel>
            <Achievements />
          </TabPanel>
          
          <TabPanel>
            <UpdateSettings />
          </TabPanel>
          
          <TabPanel>
            <VStack spacing={6} align="start">
              <Box>
                <Heading size="md" mb={2}>Candy AI Clone</Heading>
                <Text>Verze 0.8.0-alpha</Text>
              </Box>
              
              <Divider />
              
              <Box>
                <Heading size="md" mb={2}>Vibe Coding Projekt</Heading>
                <Text mb={2}>
                  Nekompromisní AI asistent s postavami, pamětí a role-playingem.
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Vytvořeno jako demonstrace "Vibe Coding" přístupu k vývoji AI aplikací.
                </Text>
              </Box>
              
              <Divider />
              
              <Box>
                <Heading size="md" mb={2}>Použité technologie</Heading>
                <Text>- Ollama (Dolphin-Mistral, WizardLM-Uncensored)</Text>
                <Text>- Stable Diffusion WebUI</Text>
                <Text>- Coqui TTS</Text>
                <Text>- Express.js, SQLite, Socket.IO</Text>
                <Text>- Electron, React, Chakra UI</Text>
              </Box>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default SettingsPage;