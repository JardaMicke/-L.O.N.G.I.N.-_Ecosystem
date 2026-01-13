import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Switch,
  Button,
  Text,
  Badge,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Divider,
  Select,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Tooltip,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import { 
  FaDownload, 
  FaInfoCircle, 
  FaExclamationTriangle, 
  FaHistory, 
  FaCheckCircle 
} from 'react-icons/fa';
import { RepeatIcon } from '@chakra-ui/icons';
import { useUpdateContext } from '../contexts/UpdateContext';
import UpdateButton from './UpdateButton';

const UpdateSettings = () => {
  const { 
    updateAvailable, 
    updateInfo, 
    checkForUpdates,
    ignoreVersion,
    updateSettings,
    getUpdateSettings,
  } = useUpdateContext();
  
  const [settings, setSettings] = useState({
    autoCheck: true,
    autoDownload: false,
    checkInterval: 3600000, // 1 hour
    updateChannel: 'stable'
  });
  
  const [isOpen, setIsOpen] = useState(false);
  const cancelRef = React.useRef();
  const toast = useToast();
  
  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);
  
  // Load update settings
  const loadSettings = async () => {
    try {
      const response = await getUpdateSettings();
      setSettings(response);
    } catch (err) {
      console.error('Error loading update settings:', err);
    }
  };
  
  // Save settings
  const saveSettings = async () => {
    try {
      await updateSettings(settings);
      toast({
        title: 'Nastavení uloženo',
        status: 'success',
        duration: 3000,
      });
    } catch (err) {
      console.error('Error saving update settings:', err);
      toast({
        title: 'Chyba při ukládání nastavení',
        status: 'error',
        duration: 3000,
      });
    }
  };
  
  // Handle settings change
  const handleSettingChange = (setting, value) => {
    setSettings({
      ...settings,
      [setting]: value
    });
  };
  
  // Handle ignore version
  const handleIgnoreVersion = async () => {
    if (updateInfo && updateInfo.version) {
      try {
        await ignoreVersion(updateInfo.version);
        setIsOpen(false);
        toast({
          title: `Verze ${updateInfo.version} bude ignorována`,
          status: 'info',
          duration: 3000,
        });
      } catch (err) {
        console.error('Error ignoring version:', err);
      }
    }
  };
  
  return (
    <Box>
      <Card variant="outline" mb={4}>
        <CardHeader>
          <Heading size="md">Aktualizace aplikace</Heading>
        </CardHeader>
        <CardBody>
          <VStack align="start" spacing={4}>
            <Box width="100%">
              <HStack justify="space-between" width="100%" mb={2}>
                <Text fontWeight="bold">Aktuální verze:</Text>
                <Badge colorScheme="blue" fontSize="0.9em" p={1}>
                  {updateInfo?.currentVersion || "1.0.0"}
                </Badge>
              </HStack>
              
              <HStack justify="space-between" width="100%" mb={2}>
                <Text fontWeight="bold">Stav aktualizace:</Text>
                {updateAvailable ? (
                  <Badge colorScheme="green" fontSize="0.9em" p={1}>
                    K dispozici je verze {updateInfo?.version}
                  </Badge>
                ) : (
                  <Badge colorScheme="gray" fontSize="0.9em" p={1}>
                    Máte nejnovější verzi
                  </Badge>
                )}
              </HStack>
              
              <HStack justify="space-between" width="100%">
                <Text fontWeight="bold">Poslední kontrola:</Text>
                <Text fontSize="sm">
                  {settings.lastUpdateCheck ? 
                    new Date(settings.lastUpdateCheck).toLocaleString() : 
                    'Nikdy'}
                </Text>
              </HStack>
            </Box>
            
            <Divider />
            
            <HStack width="100%" justify="space-between">
              <UpdateButton 
                size="md" 
                variant="solid"
                colorScheme={updateAvailable ? "green" : "blue"}
              />
              
              {updateAvailable && (
                <Tooltip label="Ignorovat tuto verzi">
                  <Button 
                    onClick={() => setIsOpen(true)}
                    variant="ghost"
                    size="sm"
                  >
                    Ignorovat
                  </Button>
                </Tooltip>
              )}
            </HStack>
            
            {updateAvailable && updateInfo && (
              <Box width="100%" mt={2} p={3} bg="gray.50" borderRadius="md">
                <Heading size="sm" mb={2}>Co je nového:</Heading>
                <List spacing={1}>
                  {updateInfo.changelog.slice(0, 3).map((item, index) => (
                    <ListItem key={index} fontSize="sm">
                      <ListIcon as={FaCheckCircle} color="green.500" />
                      {item}
                    </ListItem>
                  ))}
                  {updateInfo.changelog.length > 3 && (
                    <ListItem fontSize="sm" color="gray.500">
                      ...a další změny
                    </ListItem>
                  )}
                </List>
              </Box>
            )}
          </VStack>
        </CardBody>
      </Card>
      
      <Card variant="outline">
        <CardHeader>
          <Heading size="md">Nastavení aktualizací</Heading>
        </CardHeader>
        <CardBody>
          <VStack align="start" spacing={4}>
            <FormControl display="flex" alignItems="center">
              <FormLabel mb="0">
                Automatická kontrola aktualizací
              </FormLabel>
              <Switch 
                colorScheme="brand"
                isChecked={settings.autoCheck}
                onChange={(e) => handleSettingChange('autoCheck', e.target.checked)}
              />
            </FormControl>
            
            <FormControl display="flex" alignItems="center">
              <FormLabel mb="0">
                Automatické stahování aktualizací
              </FormLabel>
              <Switch 
                colorScheme="brand"
                isChecked={settings.autoDownload}
                onChange={(e) => handleSettingChange('autoDownload', e.target.checked)}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>
                Interval kontroly aktualizací
              </FormLabel>
              <Select 
                value={settings.checkInterval}
                onChange={(e) => handleSettingChange('checkInterval', parseInt(e.target.value))}
              >
                <option value={900000}>Každých 15 minut</option>
                <option value={3600000}>Každou hodinu</option>
                <option value={86400000}>Každý den</option>
                <option value={604800000}>Každý týden</option>
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel>
                Aktualizační kanál
              </FormLabel>
              <Select 
                value={settings.updateChannel}
                onChange={(e) => handleSettingChange('updateChannel', e.target.value)}
              >
                <option value="stable">Stabilní</option>
                <option value="beta">Beta</option>
              </Select>
            </FormControl>
            
            <Button 
              mt={2} 
              colorScheme="blue" 
              onClick={saveSettings}
              leftIcon={<FaCheckCircle />}
            >
              Uložit nastavení
            </Button>
          </VStack>
        </CardBody>
      </Card>
      
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Ignorovat aktualizaci
            </AlertDialogHeader>

            <AlertDialogBody>
              Opravdu chcete ignorovat verzi {updateInfo?.version}? Nebudete dostávat oznámení o této verzi.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsOpen(false)}>
                Zrušit
              </Button>
              <Button colorScheme="red" onClick={handleIgnoreVersion} ml={3}>
                Ignorovat
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default UpdateSettings;