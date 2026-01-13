import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useToast,
  useColorMode,
  Flex,
  Skeleton,
  Tab,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
  Text,
  Divider,
  IconButton,
  HStack
} from '@chakra-ui/react';
import { AddIcon, DownloadIcon, UploadIcon } from '@chakra-ui/icons';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import CharacterCard from '../components/CharacterCard';
import MemoryManager from '../components/MemoryManager';
import ExportImport from '../components/ExportImport';

const API_URL = 'http://localhost:3000/api';

const CharactersPage = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isExportImportOpen, 
    onOpen: onExportImportOpen, 
    onClose: onExportImportClose 
  } = useDisclosure();
  const { colorMode } = useColorMode();
  const toast = useToast();
  const navigate = useNavigate();
  const { characterId } = useParams();
  
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [character, setCharacter] = useState({
    name: '',
    personality: '',
    avatar: null,
    traits: []
  });
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [avatarFile, setAvatarFile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [traitsInput, setTraitsInput] = useState('');
  const fileInputRef = useRef(null);

  // Load characters on component mount
  useEffect(() => {
    fetchCharacters();
    
    // Load demo characters from the assets directory
    loadDemoCharacters();
  }, []);

  // Set selected character if characterId is provided
  useEffect(() => {
    if (characterId && characters.length > 0) {
      const found = characters.find(char => char.id === characterId);
      if (found) {
        setSelectedCharacter(found);
        setActiveTab(1); // Switch to Memory tab
      }
    }
  }, [characterId, characters]);

  const fetchCharacters = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/characters`);
      setCharacters(response.data);
    } catch (error) {
      console.error('Error fetching characters:', error);
      toast({
        title: 'Chyba při načítání postav',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  const loadDemoCharacters = async () => {
    try {
      // This would typically fetch from a real API endpoint
      // For demo purposes, we're simulating this
      const demoCharacters = [
        {
          id: 'sakura-01',
          name: 'Sakura',
          personality: 'Sakura je milá, energická a přátelská dívka. Je vysoce emotivní a občas trochu stydlivá, ale zároveň má odvážnou a zvědavou povahu. Miluje moderní technologie, anime a manga kulturu.',
          avatar: '/uploads/sakura_avatar.jpg',
          traits: ['Milá', 'Energická', 'Stydlivá', 'Zvědavá', 'Empatická']
        }
      ];
      
      // Merge with any existing characters from the backend
      setCharacters(prev => {
        // Filter out any duplicates by name
        const existingNames = prev.map(c => c.name.toLowerCase());
        const newChars = demoCharacters.filter(c => !existingNames.includes(c.name.toLowerCase()));
        return [...prev, ...newChars];
      });
    } catch (error) {
      console.error('Error loading demo characters:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCharacter({ ...character, [name]: value });
  };

  const handleTraitsChange = (e) => {
    setTraitsInput(e.target.value);
    // Convert comma-separated string to array
    const traitsArray = e.target.value
      .split(',')
      .map(trait => trait.trim())
      .filter(trait => trait !== '');
    
    setCharacter({ ...character, traits: traitsArray });
  };

  const handleAvatarChange = (e) => {
    if (e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!character.name || !character.personality) {
      toast({
        title: 'Vyplňte všechna povinná pole',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', character.name);
      formData.append('personality', character.personality);
      
      // Add traits if available
      if (character.traits && character.traits.length > 0) {
        formData.append('traits', JSON.stringify(character.traits));
      }
      
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      let response;
      if (editMode) {
        // Update existing character
        response = await axios.put(`${API_URL}/characters/${character.id}`, formData);
      } else {
        // Create new character
        response = await axios.post(`${API_URL}/characters`, formData);
      }

      setLoading(false);
      onClose();
      
      // Reset form
      setCharacter({
        name: '',
        personality: '',
        avatar: null,
        traits: []
      });
      setTraitsInput('');
      setAvatarFile(null);
      setEditMode(false);
      
      // Refresh character list
      fetchCharacters();
      
      toast({
        title: editMode ? 'Postava upravena' : 'Postava vytvořena',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error saving character:', error);
      setLoading(false);
      toast({
        title: 'Chyba při ukládání postavy',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEdit = (char) => {
    // Set traits input string from array
    const traitsString = char.traits ? char.traits.join(', ') : '';
    setTraitsInput(traitsString);
    
    setCharacter(char);
    setEditMode(true);
    onOpen();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Opravdu chcete smazat tuto postavu? Tato akce je nevratná.')) {
      try {
        await axios.delete(`${API_URL}/characters/${id}`);
        fetchCharacters();
        
        toast({
          title: 'Postava smazána',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Error deleting character:', error);
        toast({
          title: 'Chyba při mazání postavy',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const createConversation = async (characterId) => {
    try {
      const response = await axios.post(`${API_URL}/conversations`, {
        character_id: characterId,
        title: 'Nová konverzace'
      });
      
      // Navigate to the new conversation
      navigate(`/chat/${response.data.id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: 'Chyba při vytváření konverzace',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const showCharacterMemory = (characterId) => {
    setSelectedCharacter(characters.find(c => c.id === characterId));
    setActiveTab(1); // Switch to Memory tab
  };

  // Handle export/import completion
  const handleImportSuccess = (newCharacter) => {
    // Refresh character list
    fetchCharacters();
    
    toast({
      title: 'Import dokončen',
      description: `Postava ${newCharacter.name} byla úspěšně importována`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box>
      <Tabs 
        index={activeTab} 
        onChange={setActiveTab} 
        variant="soft-rounded" 
        colorScheme="pink" 
        mb={6}
      >
        <Flex justify="space-between" align="center" mb={4}>
          <TabList>
            <Tab>Postavy</Tab>
            {selectedCharacter && (
              <Tab>Paměť: {selectedCharacter.name}</Tab>
            )}
          </TabList>
          
          {activeTab === 0 && (
            <HStack>
              <IconButton
                icon={<DownloadIcon />}
                aria-label="Export/Import"
                variant="outline"
                colorScheme="blue"
                onClick={onExportImportOpen}
                mr={2}
              />
              <Button 
                leftIcon={<AddIcon />} 
                colorScheme="brand" 
                onClick={() => {
                  setCharacter({ name: '', personality: '', avatar: null, traits: [] });
                  setTraitsInput('');
                  setEditMode(false);
                  onOpen();
                }}
              >
                Nová postava
              </Button>
            </HStack>
          )}
        
        <TabPanels>
          {/* Characters List Tab */}
          <TabPanel px={0}>
            {loading ? (
              <SimpleGrid spacing={6} columns={{ base: 1, md: 2, lg: 3 }}>
                {[1, 2, 3].map((item) => (
                  <Skeleton key={item} height="400px" borderRadius="lg" />
                ))}
              </SimpleGrid>
            ) : characters.length > 0 ? (
              <SimpleGrid spacing={6} columns={{ base: 1, md: 2, lg: 3 }}>
                {characters.map((char) => (
                  <CharacterCard
                    key={char.id}
                    character={char}
                    onChat={createConversation}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onMemory={() => showCharacterMemory(char.id)}
                    onExport={() => {
                      setSelectedCharacter(char);
                      onExportImportOpen();
                    }}
                  />
                ))}
              </SimpleGrid>
            ) : (
              <Flex 
                direction="column" 
                align="center" 
                justify="center" 
                p={10}
                bg={colorMode === 'dark' ? 'gray.700' : 'gray.100'}
                borderRadius="md"
              >
                <Heading size="md" mb={4}>Žádné postavy</Heading>
                <Text mb={4}>Zatím nemáte vytvořené žádné postavy.</Text>
                <Button 
                  leftIcon={<AddIcon />} 
                  colorScheme="brand"
                  onClick={() => {
                    setCharacter({ name: '', personality: '', avatar: null, traits: [] });
                    setTraitsInput('');
                    setEditMode(false);
                    onOpen();
                  }}
                >
                  Vytvořit novou postavu
                </Button>
              </Flex>
            )}
          </TabPanel>
          
          {/* Character Memory Tab */}
          <TabPanel px={0}>
            {selectedCharacter ? (
              <>
                <Flex align="center" mb={4}>
                  <Button variant="ghost" onClick={() => setActiveTab(0)} mr={2}>
                    « Zpět na postavy
                  </Button>
                  <Divider orientation="vertical" h="24px" />
                  <Heading size="md" ml={4}>{selectedCharacter.name}</Heading>
                </Flex>
                
                <MemoryManager characterId={selectedCharacter.id} />
              </>
            ) : (
              <Flex 
                direction="column" 
                align="center" 
                justify="center" 
                p={10}
                bg={colorMode === 'dark' ? 'gray.700' : 'gray.100'}
                borderRadius="md"
              >
                <Heading size="md" mb={4}>Žádná postava není vybrána</Heading>
                <Button onClick={() => setActiveTab(0)}>
                  Zpět na seznam postav
                </Button>
              </Flex>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Character Form Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editMode ? 'Upravit postavu' : 'Vytvořit novou postavu'}</ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <FormControl isRequired mb={4}>
              <FormLabel>Jméno</FormLabel>
              <Input 
                name="name" 
                value={character.name} 
                onChange={handleInputChange} 
                placeholder="Jméno postavy"
              />
            </FormControl>
            
            <FormControl mb={4}>
              <FormLabel>Vlastnosti (oddělené čárkou)</FormLabel>
              <Input 
                name="traits" 
                value={traitsInput} 
                onChange={handleTraitsChange} 
                placeholder="Milá, Přátelská, Inteligentní..."
              />
            </FormControl>
            
            <FormControl isRequired mb={4}>
              <FormLabel>Osobnost</FormLabel>
              <Textarea 
                name="personality" 
                value={character.personality} 
                onChange={handleInputChange} 
                placeholder="Popis osobnosti, chování, historie a charakteru..."
                rows={5}
              />
            </FormControl>
            
            <FormControl mb={4}>
              <FormLabel>Avatar</FormLabel>
              <Input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                onChange={handleAvatarChange} 
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Zrušit
            </Button>
            <Button 
              colorScheme="brand" 
              onClick={handleSubmit}
              isLoading={loading}
            >
              {editMode ? 'Uložit změny' : 'Vytvořit'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Export/Import Modal */}
      <ExportImport 
        isOpen={isExportImportOpen}
        onClose={onExportImportClose}
        onSuccess={handleImportSuccess}
        characterId={selectedCharacter?.id}
      />
    </Box>
  );
};

export default CharactersPage;