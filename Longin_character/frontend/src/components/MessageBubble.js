import React from 'react';
import {
  Box,
  Flex,
  Text,
  Image,
  useColorMode,
  Avatar,
} from '@chakra-ui/react';
import ReactMarkdown from 'react-markdown';

const MessageBubble = ({ message, character }) => {
  const { colorMode } = useColorMode();
  const isUser = message.sender === 'user';
  
  // Check if the message is an image
  const isImage = message.content.startsWith('![');
  
  // Extract image URL if it's an image message
  const getImageUrl = () => {
    if (!isImage) return null;
    const match = message.content.match(/\((.*?)\)/);
    return match ? match[1] : null;
  };
  
  return (
    <Flex
      justify={isUser ? 'flex-end' : 'flex-start'}
      mb={4}
    >
      {!isUser && character && (
        <Avatar 
          src={character.avatar ? `http://localhost:3000${character.avatar}` : null}
          name={character.name}
          size="sm"
          mr={2}
          bg="pink.400"
        />
      )}
      
      <Box
        maxW="80%"
        bg={
          isUser
            ? colorMode === 'dark' ? 'brand.600' : 'brand.100'
            : colorMode === 'dark' ? 'gray.700' : 'gray.100'
        }
        color={isUser && colorMode === 'dark' ? 'white' : undefined}
        p={3}
        borderRadius="lg"
        boxShadow="sm"
      >
        {isImage ? (
          <Image 
            src={getImageUrl()} 
            alt="Generated" 
            borderRadius="md" 
          />
        ) : (
          <ReactMarkdown>
            {message.content}
          </ReactMarkdown>
        )}
      </Box>
      
      {isUser && (
        <Avatar 
          name="User"
          size="sm"
          ml={2}
          bg="blue.400"
        />
      )}
    </Flex>
  );
};

export default MessageBubble;