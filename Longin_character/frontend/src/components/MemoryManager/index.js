import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Flex,
  Button,
  IconButton,
  Badge,
  Input,
  Select,
  Textarea,
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
  FormControl,
  FormLabel,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorMode,
  Tag,
  TagLabel,
  TagCloseButton,
  useToast,
  Divider,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Spinner
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon, StarIcon, SearchIcon } from '@chakra-ui/icons';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const MemoryManager = ({ characterId }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { colorMode } = useColorMode();
  const toast = useToast();
  
  const [memories, setMemories] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [memory, setMemory] = useState({
    type: 'fact',
    content: '',
    tags: [],
    importance: 5
  });
  const [editMode, setEditMode] = useState(false);
  const [currentMemoryId, setCurrentMemoryId] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Load memories on component mount
  useEffect(() => {
    if (characterId) {
      fetchMemories();
      fetchRelationships();
    }
  }, [characterId]);
  
  // Fetch memories from API
  const fetchMemories = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/memories/${characterId}`);
      setMemories(response.data);
    } catch (error) {
      console.error('Error fetching memories:', error);
      toast({
        title: 'Chyba při načítání vzpomínek',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch relationships from API
  const fetchRelationships = async () => {
    try {
      const response = await axios.get(`${API_URL}/relationships/${characterId}`);
      setRelationships(response.data);
    } catch (error) {
      console.error('Error fetching relationships:', error);
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMemory({ ...memory, [name]: value });
  };
  
  // Handle importance slider
  const handleImportanceChange = (value) => {
    setMemory({ ...memory, importance: value });
  };
  
  // Handle tag input
  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };
  
  // Add tag to memory
  const addTag = () => {
    if (!tagInput.trim()) return;
    
    const newTag = tagInput.trim().toLowerCase();
    if (!memory.tags.includes(newTag)) {
      setMemory({ ...memory, tags: [...memory.tags, newTag] });
    }
    setTagInput('');
  };
  
  // Remove tag from memory
  const removeTag = (tagToRemove) => {
    setMemory({
      ...memory,
      tags: memory.tags.filter(tag => tag !== tagToRemove)
    });
  };
  
  // Create new memory
  const createMemory = async () => {
    if (!memory.content.trim()) {
      toast({
        title: 'Obsah vzpomínky je povinný',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setLoading(true);
    try {
      const data = {
        character_id: characterId,
        type: memory.type,
        content: memory.content,
        tags: memory.tags,
        importance: memory.importance
      };
      
      let response;
      if (editMode && currentMemoryId) {
        // Update existing memory
        response = await axios.put(`${API_URL}/memories/${currentMemoryId}`, data);
        toast({
          title: 'Vzpomínka upravena',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Create new memory
        response = await axios.post(`${API_URL}/memories`, data);
        toast({
          title: 'Vzpomínka vytvořena',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      // Refresh memories
      fetchMemories();
      
      // Reset form
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error saving memory:', error);
      toast({
        title: 'Chyba při ukládání vzpomínky',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Delete memory
  const deleteMemory = async (memoryId) => {
    if (!window.confirm('Opravdu chcete smazat tuto vzpomínku?')) return;
    
    try {
      await axios.delete(`${API_URL}/memories/${memoryId}`);
      
      // Remove from state
      setMemories(memories.filter(m => m.id !== memoryId));
      
      toast({
        title: 'Vzpomínka smazána',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting memory:', error);
      toast({
        title: 'Chyba při mazání vzpomínky',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Edit memory
  const editMemory = (memory) => {
    setMemory({
      type: memory.type,
      content: memory.content,
      tags: memory.tags || [],
      importance: memory.importance
    });
    setCurrentMemoryId(memory.id);
    setEditMode(true);
    onOpen();
  };
  
  // Reset form
  const resetForm = () => {
    setMemory({
      type: 'fact',
      content: '',
      tags: [],
      importance: 5
    });
    setTagInput('');
    setEditMode(false);
    setCurrentMemoryId(null);
  };
  
  // Update relationship
  const updateRelationship = async (type, value) => {
    try {
      await axios.post(`${API_URL}/relationships`, {
        character_id: characterId,
        type,
        value,
        description: `Set by user on ${new Date().toLocaleString()}`
      });
      
      // Update local state
      setRelationships(prev => {
        const existing = prev.find(r => r.relationship_type === type);
        if (existing) {
          return prev.map(r => r.relationship_type === type ? { ...r, value } : r);
        } else {
          return [...prev, { character_id: characterId, relationship_type: type, value }];
        }
      });
      
      toast({
        title: 'Vztah aktualizován',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating relationship:', error);
      toast({
        title: 'Chyba při aktualizaci vztahu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Filter memories by type and search term
  const filteredMemories = memories.filter(memory => {
    const matchesType = !filterType || memory.type === filterType;
    const matchesSearch = !searchTerm || 
      memory.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (memory.tags && memory.tags.some(tag => tag.includes(searchTerm.toLowerCase())));
    
    return matchesType && matchesSearch;
  });
  
  // Get relationship value by type
  const getRelationshipValue = (type) => {
    const relationship = relationships.find(r => r.relationship_type === type);
    return relationship ? relationship.value : 0;
  };
  
  // Group memories by type
  const groupedMemories = filteredMemories.reduce((acc, memory) => {
    if (!acc[memory.type]) {
      acc[memory.type] = [];
    }
    acc[memory.type].push(memory);
    return acc;
  }, {});
  
  // Get badge color for memory type
  const getTypeColor = (type) => {
    const typeColors = {
      fact: 'blue',
      preference: 'purple',
      event: 'green',
      opinion: 'orange',
      belief: 'teal'
    };
    return typeColors[type] || 'gray';
  };
  
  return (
    <Box>
      <Tabs colorScheme="brand">
        <TabList>
          <Tab>Vzpomínky</Tab>
          <Tab>Vztahy</Tab>
        </TabList>
        
        <TabPanels>
          {/* Memories Tab */}
          <TabPanel p={0} pt={4}>
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="md">Vzpomínky postavy</Heading>
              <Button 
                leftIcon={<AddIcon />}
                colorScheme="brand"
                onClick={() => {
                  resetForm();
                  onOpen();
                }}
              >
                Nová vzpomínka
              </Button>
            </Flex>
            
            {/* Filters */}
            <Flex mb={4} gap={2} flexWrap="wrap">
              <Select 
                placeholder="Všechny typy" 
                maxW="200px"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="fact">Fakty</option>
                <option value="preference">Preference</option>
                <option value="event">Události</option>
                <option value="opinion">Názory</option>
                <option value="belief">Přesvědčení</option>
              </Select>
              
              <Flex flex="1" maxW={{ base: "100%", md: "300px" }}>
                <Input 
                  placeholder="Hledat ve vzpomínkách..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <IconButton
                  aria-label="Search"
                  icon={<SearchIcon />}
                  ml={1}
                />
              </Flex>
            </Flex>
            
            {/* Memories List */}
            {loading ? (
              <Flex justify="center" my={10}>
                <Spinner size="xl" color="brand.500" />
              </Flex>
            ) : filteredMemories.length === 0 ? (
              <Box textAlign="center" my={10} p={5} borderRadius="md" bg={colorMode === 'dark' ? 'gray.700' : 'gray.100'}>
                <Text mb={4}>Žádné vzpomínky nebyly nalezeny.</Text>
                <Button leftIcon={<AddIcon />} colorScheme="brand" onClick={onOpen}>
                  Vytvořit první vzpomínku
                </Button>
              </Box>
            ) : (
              <VStack align="stretch" spacing={4}>
                {Object.entries(groupedMemories).map(([type, typeMemories]) => (
                  <Box key={type}>
                    <Heading size="sm" mb={2} color={`${getTypeColor(type)}.500`}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}y ({typeMemories.length})
                    </Heading>
                    
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      {typeMemories.map(memory => (
                        <Card key={memory.id} variant="outline">
                          <CardHeader pb={0}>
                            <Flex justify="space-between" align="center">
                              <Badge colorScheme={getTypeColor(memory.type)} px={2} py={1}>
                                {memory.type}
                              </Badge>
                              <HStack>
                                <IconButton
                                  icon={<EditIcon />}
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => editMemory(memory)}
                                />
                                <IconButton
                                  icon={<DeleteIcon />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="red"
                                  onClick={() => deleteMemory(memory.id)}
                                />
                              </HStack>
                            </Flex>
                          </CardHeader>
                          
                          <CardBody py={2}>
                            <Text>{memory.content}</Text>
                          </CardBody>
                          
                          <CardFooter pt={0} flexWrap="wrap">
                            {memory.tags && memory.tags.map(tag => (
                              <Tag 
                                key={tag} 
                                size="sm" 
                                colorScheme="brand" 
                                variant="subtle"
                                mr={1}
                                mb={1}
                              >
                                <TagLabel>{tag}</TagLabel>
                              </Tag>
                            ))}
                            
                            <Badge ml="auto" colorScheme={memory.importance > 7 ? 'red' : 'gray'}>
                              Důležitost: {memory.importance}/10
                            </Badge>
                          </CardFooter>
                        </Card>
                      ))}
                    </SimpleGrid>
                  </Box>
                ))}
              </VStack>
            )}
          </TabPanel>
          
          {/* Relationships Tab */}
          <TabPanel p={0} pt={4}>
            <Heading size="md" mb={4}>Vztahy</Heading>
            
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Card variant="outline">
                <CardHeader>
                  <Heading size="sm">Náklonnost</Heading>
                </CardHeader>
                <CardBody>
                  <VStack align="stretch">
                    <Text>Úroveň: {getRelationshipValue('affection')}</Text>
                    <HStack>
                      <Button size="sm" onClick={() => updateRelationship('affection', -50)}>Nízká</Button>
                      <Button size="sm" onClick={() => updateRelationship('affection', 0)}>Neutrální</Button>
                      <Button size="sm" onClick={() => updateRelationship('affection', 50)}>Střední</Button>
                      <Button size="sm" onClick={() => updateRelationship('affection', 100)}>Vysoká</Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
              
              <Card variant="outline">
                <CardHeader>
                  <Heading size="sm">Důvěra</Heading>
                </CardHeader>
                <CardBody>
                  <VStack align="stretch">
                    <Text>Úroveň: {getRelationshipValue('trust')}</Text>
                    <HStack>
                      <Button size="sm" onClick={() => updateRelationship('trust', -50)}>Nízká</Button>
                      <Button size="sm" onClick={() => updateRelationship('trust', 0)}>Neutrální</Button>
                      <Button size="sm" onClick={() => updateRelationship('trust', 50)}>Střední</Button>
                      <Button size="sm" onClick={() => updateRelationship('trust', 100)}>Vysoká</Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
              
              <Card variant="outline">
                <CardHeader>
                  <Heading size="sm">Blízkost</Heading>
                </CardHeader>
                <CardBody>
                  <VStack align="stretch">
                    <Text>Úroveň: {getRelationshipValue('familiarity')}</Text>
                    <HStack>
                      <Button size="sm" onClick={() => updateRelationship('familiarity', -50)}>Cizí</Button>
                      <Button size="sm" onClick={() => updateRelationship('familiarity', 0)}>Známí</Button>
                      <Button size="sm" onClick={() => updateRelationship('familiarity', 50)}>Přátelé</Button>
                      <Button size="sm" onClick={() => updateRelationship('familiarity', 100)}>Blízcí</Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
              
              <Card variant="outline">
                <CardHeader>
                  <Heading size="sm">Respekt</Heading>
                </CardHeader>
                <CardBody>
                  <VStack align="stretch">
                    <Text>Úroveň: {getRelationshipValue('respect')}</Text>
                    <HStack>
                      <Button size="sm" onClick={() => updateRelationship('respect', -50)}>Nízký</Button>
                      <Button size="sm" onClick={() => updateRelationship('respect', 0)}>Neutrální</Button>
                      <Button size="sm" onClick={() => updateRelationship('respect', 50)}>Střední</Button>
                      <Button size="sm" onClick={() => updateRelationship('respect', 100)}>Vysoký</Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            </SimpleGrid>
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      {/* Memory Form Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editMode ? 'Upravit vzpomínku' : 'Nová vzpomínka'}
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Typ vzpomínky</FormLabel>
                <Select 
                  name="type"
                  value={memory.type}
                  onChange={handleInputChange}
                >
                  <option value="fact">Fakt</option>
                  <option value="preference">Preference</option>
                  <option value="event">Událost</option>
                  <option value="opinion">Názor</option>
                  <option value="belief">Přesvědčení</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Obsah</FormLabel>
                <Textarea 
                  name="content"
                  value={memory.content}
                  onChange={handleInputChange}
                  placeholder="Co si postava pamatuje..."
                  rows={4}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Tagy (pro vyhledávání a relevanci)</FormLabel>
                <Flex>
                  <Input 
                    value={tagInput}
                    onChange={handleTagInputChange}
                    placeholder="Přidat tag..."
                  />
                  <Button ml={2} onClick={addTag}>
                    Přidat
                  </Button>
                </Flex>
                
                <Flex mt={2} flexWrap="wrap">
                  {memory.tags.map(tag => (
                    <Tag 
                      key={tag} 
                      m={1} 
                      colorScheme="brand"
                    >
                      <TagLabel>{tag}</TagLabel>
                      <TagCloseButton onClick={() => removeTag(tag)} />
                    </Tag>
                  ))}
                </Flex>
              </FormControl>
              
              <FormControl>
                <FormLabel>Důležitost: {memory.importance}/10</FormLabel>
                <HStack>
                  <Button size="sm" onClick={() => handleImportanceChange(1)}>1</Button>
                  <Button size="sm" onClick={() => handleImportanceChange(3)}>3</Button>
                  <Button size="sm" onClick={() => handleImportanceChange(5)}>5</Button>
                  <Button size="sm" onClick={() => handleImportanceChange(7)}>7</Button>
                  <Button size="sm" onClick={() => handleImportanceChange(10)}>10</Button>
                </HStack>
              </FormControl>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Zrušit
            </Button>
            <Button 
              colorScheme="brand" 
              onClick={createMemory}
              isLoading={loading}
            >
              {editMode ? 'Uložit změny' : 'Vytvořit'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default MemoryManager;