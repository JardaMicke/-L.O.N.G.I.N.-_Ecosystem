import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Text,
  Icon,
  Flex,
  Divider,
  Button,
  useColorMode,
  Tooltip,
} from '@chakra-ui/react';
import { 
  ChatIcon, 
  StarIcon, 
  SettingsIcon, 
  AddIcon,
  ViewIcon
} from '@chakra-ui/icons';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const Sidebar = ({ isOpen }) => {
  const { colorMode } = useColorMode();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [activeCharacter, setActiveCharacter] = useState(null);

  // Load characters and conversations
  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const response = await axios.get(`${API_URL}/characters`);
        setCharacters(response.data);
        
        if (response.data.length > 0) {
          setActiveCharacter(response.data[0]);
          fetchConversations(response.data[0].id);
        }
      } catch (error) {
        console.error('Error fetching characters:', error);
      }
    };

    fetchCharacters();
  }, []);

  const fetchConversations = async (characterId) => {
    try {
      const response = await axios.get(`${API_URL}/conversations/${characterId}`);
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const createNewConversation = async () => {
    if (!activeCharacter) return;
    
    try {
      const response = await axios.post(`${API_URL}/conversations`, {
        character_id: activeCharacter.id,
        title: `Konverzace ${conversations.length + 1}`
      });
      
      setConversations([response.data, ...conversations]);
      
      // Redirect to the new conversation
      window.location.hash = `#/chat/${response.data.id}`;
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  // If sidebar is closed, render minimal version
  if (!isOpen) {
    return (
      <Box
        as="nav"
        bg={colorMode === 'dark' ? 'gray.900' : 'gray.50'}
        borderRight="1px"
        borderRightColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
        w="60px"
        h="100vh"
        py={5}
      >
        <VStack spacing={5}>
          <Tooltip label="Chat" placement="right">
            <Link to="/chat">
              <Icon 
                as={ChatIcon} 
                w={6} 
                h={6} 
                color={location.pathname.includes('/chat') ? 'brand.500' : 'gray.500'} 
              />
            </Link>
          </Tooltip>
          
          <Tooltip label="Postavy" placement="right">
            <Link to="/characters">
              <Icon 
                as={StarIcon} 
                w={6} 
                h={6} 
                color={location.pathname.includes('/characters') ? 'brand.500' : 'gray.500'} 
              />
            </Link>
          </Tooltip>
          
          <Tooltip label="Role-Playing" placement="right">
            <Link to="/roleplaying">
              <Icon 
                as={ViewIcon} 
                w={6} 
                h={6} 
                color={location.pathname.includes('/roleplaying') ? 'brand.500' : 'gray.500'} 
              />
            </Link>
          </Tooltip>
          
          <Tooltip label="Nastavení" placement="right">
            <Link to="/settings">
              <Icon 
                as={SettingsIcon} 
                w={6} 
                h={6} 
                color={location.pathname.includes('/settings') ? 'brand.500' : 'gray.500'} 
              />
            </Link>
          </Tooltip>
        </VStack>
      </Box>
    );
  }

  return (
    <Box
      as="nav"
      bg={colorMode === 'dark' ? 'gray.900' : 'gray.50'}
      borderRight="1px"
      borderRightColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
      w="250px"
      h="100vh"
      py={5}
      overflowY="auto"
    >
      <VStack align="stretch" spacing={4}>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="brand"
          mx={4}
          onClick={createNewConversation}
        >
          Nová konverzace
        </Button>
        
        <Divider />
        
        {/* Main Navigation */}
        <VStack align="stretch" px={4} spacing={1}>
          <Link to="/chat">
            <Flex
              align="center"
              p={2}
              borderRadius="md"
              bg={location.pathname.includes('/chat') ? (colorMode === 'dark' ? 'gray.700' : 'gray.200') : 'transparent'}
              _hover={{ bg: colorMode === 'dark' ? 'gray.700' : 'gray.200' }}
            >
              <Icon as={ChatIcon} mr={3} />
              <Text>Chat</Text>
            </Flex>
          </Link>
          
          <Link to="/characters">
            <Flex
              align="center"
              p={2}
              borderRadius="md"
              bg={location.pathname.includes('/characters') ? (colorMode === 'dark' ? 'gray.700' : 'gray.200') : 'transparent'}
              _hover={{ bg: colorMode === 'dark' ? 'gray.700' : 'gray.200' }}
            >
              <Icon as={StarIcon} mr={3} />
              <Text>Postavy</Text>
            </Flex>
          </Link>
          
          <Link to="/roleplaying">
            <Flex
              align="center"
              p={2}
              borderRadius="md"
              bg={location.pathname.includes('/roleplaying') ? (colorMode === 'dark' ? 'gray.700' : 'gray.200') : 'transparent'}
              _hover={{ bg: colorMode === 'dark' ? 'gray.700' : 'gray.200' }}
            >
              <Icon as={ViewIcon} mr={3} />
              <Text>Role-Playing</Text>
            </Flex>
          </Link>
          
          <Link to="/settings">
            <Flex
              align="center"
              p={2}
              borderRadius="md"
              bg={location.pathname.includes('/settings') ? (colorMode === 'dark' ? 'gray.700' : 'gray.200') : 'transparent'}
              _hover={{ bg: colorMode === 'dark' ? 'gray.700' : 'gray.200' }}
            >
              <Icon as={SettingsIcon} mr={3} />
              <Text>Nastavení</Text>
            </Flex>
          </Link>
        </VStack>
        
        <Divider />
        
        {/* Conversations List */}
        <Box px={4}>
          <Text fontWeight="bold" mb={2}>Konverzace</Text>
          <VStack align="stretch" spacing={1}>
            {conversations.map(conversation => (
              <Link key={conversation.id} to={`/chat/${conversation.id}`}>
                <Flex
                  align="center"
                  p={2}
                  borderRadius="md"
                  bg={
                    location.pathname === `/chat/${conversation.id}` 
                      ? (colorMode === 'dark' ? 'gray.700' : 'gray.200') 
                      : 'transparent'
                  }
                  _hover={{ bg: colorMode === 'dark' ? 'gray.700' : 'gray.200' }}
                >
                  <Text fontSize="sm" noOfLines={1}>{conversation.title}</Text>
                </Flex>
              </Link>
            ))}
            
            {conversations.length === 0 && (
              <Text fontSize="sm" color="gray.500">Žádné konverzace</Text>
            )}
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default Sidebar;