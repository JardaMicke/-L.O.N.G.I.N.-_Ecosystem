import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Flex,
  Input,
  Button,
  VStack,
  Text,
  Avatar,
  Spinner,
  IconButton,
  useColorMode,
  Textarea,
  Image,
  Divider,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip
} from '@chakra-ui/react';
import { 
  ArrowForwardIcon,
  MicrophoneIcon, 
  AttachmentIcon,
  ChevronDownIcon,
  AddIcon,
  SettingsIcon,
  DeleteIcon,
  StarIcon,
  VolumeUpIcon,
  VolumeMuteIcon
} from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import MessageBubble from '../components/MessageBubble';
import AudioManager, { AudioService } from '../components/AudioManager';

const API_URL = 'http://localhost:3000/api';
const SOCKET_URL = 'http://localhost:3000';

const ChatPage = () => {
  const { conversationId } = useParams();
  const { colorMode } = useColorMode();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [character, setCharacter] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  const [socket, setSocket] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const messagesEndRef = useRef(null);
  const audioManagerRef = useRef(null);
  
  // Set up audio service
  useEffect(() => {
    AudioService.setInstance(audioManagerRef);
    return () => {
      AudioService.clearQueue();
    };
  }, []);
  
  // Connect to socket and load conversation
  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Join conversation room when ID changes
  useEffect(() => {
    if (!socket || !conversationId) return;

    // Join the conversation room
    socket.emit('join-conversation', conversationId);

    // Listen for streaming responses
    socket.on('llm-response-chunk', (data) => {
      if (data.conversationId === conversationId) {
        setIsTyping(true);
        setStreamingResponse(prev => prev + data.content);
      }
    });

    // Listen for completed message
    socket.on('message-complete', (data) => {
      if (data.conversation_id === conversationId) {
        setIsTyping(false);
        setStreamingResponse('');
        
        // Add the complete message to the list
        setMessages(prevMessages => [...prevMessages, data]);
        
        // If text-to-speech is enabled, speak the message
        if (character && voiceEnabled) {
          speakMessage(data.content);
        }
      }
    });

    // Load conversation data
    loadConversation();

    return () => {
      socket.off('llm-response-chunk');
      socket.off('message-complete');
    };
  }, [socket, conversationId, voiceEnabled]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingResponse]);

  const loadConversation = async () => {
    if (!conversationId) return;
    
    try {
      // Get messages
      const messagesResponse = await axios.get(`${API_URL}/messages/${conversationId}`);
      setMessages(messagesResponse.data);
      
      // Get character info
      if (messagesResponse.data.length > 0) {
        const characterId = messagesResponse.data[0].character_id;
        if (characterId) {
          const characterResponse = await axios.get(`${API_URL}/characters/${characterId}`);
          setCharacter(characterResponse.data);
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !conversationId) return;
    
    try {
      // Send user message
      const response = await axios.post(`${API_URL}/messages`, {
        conversation_id: conversationId,
        sender: 'user',
        content: message
      });
      
      // Add to messages list
      setMessages([...messages, response.data]);
      
      // Clear input
      setMessage('');
      
      // Backend will automatically generate AI response via socket
      setIsTyping(true);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const generateImage = async (prompt) => {
    try {
      const response = await axios.post(`${API_URL}/generate-image`, {
        prompt: prompt
      });
      
      if (response.data.success) {
        // Send the image URL as a message
        await axios.post(`${API_URL}/messages`, {
          conversation_id: conversationId,
          sender: 'assistant',
          content: `![Generated Image](http://localhost:3000${response.data.imageUrl})`
        });
        
        // Reload messages
        loadConversation();
      }
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };
  
  const speakMessage = async (text) => {
    // Skip TTS for image messages
    if (text.startsWith('![')) return;
    
    setIsSpeaking(true);
    
    // Use Audio Service to generate and play speech
    const voiceId = 'en_female_1'; // Could be customized per character
    const result = await AudioService.generateSpeech(text, voiceId);
    
    if (!result) {
      setIsSpeaking(false);
    }
  };

  return (
    <Flex direction="column" h="100%">
      {/* Character Info */}
      {character && (
        <Flex 
          align="center" 
          p={3} 
          borderBottom="1px" 
          borderColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
          bg={colorMode === 'dark' ? 'gray.800' : 'white'}
        >
          <Avatar 
            src={character.avatar ? `http://localhost:3000${character.avatar}` : null} 
            name={character.name}
            mr={3}
          />
          <Box flex="1">
            <Text fontWeight="bold">{character.name}</Text>
            <Text fontSize="sm" noOfLines={1} color="gray.500">
              {character.traits ? character.traits.join(', ') : "Online"}
            </Text>
          </Box>
          <IconButton
            icon={voiceEnabled ? <VolumeUpIcon /> : <VolumeMuteIcon />}
            aria-label={voiceEnabled ? "Mute voice" : "Enable voice"}
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            variant="ghost"
            mr={2}
          />
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Options"
              icon={<ChevronDownIcon />}
              variant="ghost"
            />
            <MenuList>
              <MenuItem icon={<StarIcon />}>Přidat do oblíbených</MenuItem>
              <MenuItem icon={<SettingsIcon />}>Upravit postavu</MenuItem>
              <MenuItem icon={<DeleteIcon />}>Smazat konverzaci</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      )}
      
      {/* Audio Manager */}
      <Box px={4} pt={2}>
        <AudioManager ref={audioManagerRef} />
      </Box>
      
      {/* Messages Container */}
      <Box flex="1" overflowY="auto" px={4} py={4} bg={colorMode === 'dark' ? 'gray.900' : 'gray.50'}>
        <VStack spacing={4} align="stretch">
          {messages.map((msg) => (
            <MessageBubble 
              key={msg.id} 
              message={msg} 
              character={character}
            />
          ))}
          
          {/* Streaming response */}
          {isTyping && streamingResponse && (
            <MessageBubble 
              message={{
                sender: 'assistant',
                content: streamingResponse
              }}
              character={character}
            />
          )}
          
          {/* Typing indicator */}
          {isTyping && !streamingResponse && (
            <Flex alignSelf="flex-start" p={2}>
              <Spinner size="sm" mr={2} />
              <Text fontSize="sm">
                {character ? `${character.name} píše...` : 'AI přemýšlí...'}
              </Text>
            </Flex>
          )}
          
          {/* Speaking indicator */}
          {isSpeaking && (
            <Flex justify="center" py={2}>
              <Text fontSize="sm" color="brand.500">
                <Spinner size="xs" mr={2} />
                Přehrávání hlasu...
              </Text>
            </Flex>
          )}
          
          <div ref={messagesEndRef} />
        </VStack>
      </Box>
      
      {/* Input Area */}
      <Box
        p={4}
        borderTopWidth="1px"
        borderColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
        bg={colorMode === 'dark' ? 'gray.800' : 'white'}
      >
        <HStack mb={2} spacing={2}>
          <Tooltip label="Generovat obrázek">
            <IconButton
              icon={<AttachmentIcon />}
              variant="ghost"
              aria-label="Generate image"
              onClick={() => {
                const imagePrompt = prompt('Zadejte prompt pro generování obrázku:');
                if (imagePrompt) {
                  generateImage(imagePrompt);
                }
              }}
            />
          </Tooltip>
          
          <Tooltip label="Hlasový vstup">
            <IconButton
              icon={<MicrophoneIcon />}
              variant="ghost"
              aria-label="Voice input"
            />
          </Tooltip>
          
          <Divider orientation="vertical" h="24px" />
          
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="More options"
              icon={<AddIcon />}
              variant="ghost"
            />
            <MenuList>
              <MenuItem>Herní mód</MenuItem>
              <MenuItem>Uložit konverzaci</MenuItem>
              <MenuItem>Export jako PDF</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
        
        <Flex>
          <Textarea
            placeholder="Napiš zprávu..."
            resize="none"
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            mr={2}
            borderRadius="lg"
          />
          
          <IconButton
            icon={<ArrowForwardIcon />}
            colorScheme="brand"
            onClick={sendMessage}
            aria-label="Send message"
            isDisabled={!message.trim() || !conversationId}
            alignSelf="flex-end"
            height="40px"
          />
        </Flex>
      </Box>
    </Flex>
  );
};

export default ChatPage;