import React from 'react';
import {
  Box,
  Image,
  Text,
  Heading,
  Stack,
  Button,
  IconButton,
  Flex,
  Badge,
  useColorMode,
  Card,
  CardBody,
  CardFooter,
  Divider
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, ChatIcon, StarIcon, DownloadIcon } from '@chakra-ui/icons';

const CharacterCard = ({ character, onChat, onEdit, onDelete, onMemory, onExport }) => {
  const { colorMode } = useColorMode();
  
  // Parse traits from personality if available
  const getTraits = () => {
    if (character.traits && Array.isArray(character.traits)) {
      return character.traits;
    }
    
    // As a fallback, try to extract some keywords from the personality
    const keywords = ['milá', 'přátelská', 'inteligentní', 'vtipná', 'zvědavá', 'empatická', 'kreativní', 'energická', 'stydlivá'];
    const personality = character.personality.toLowerCase();
    return keywords.filter(word => personality.includes(word));
  };
  
  const traits = getTraits();

  return (
    <Card 
      overflow="hidden"
      variant="outline"
      bg={colorMode === 'dark' ? 'gray.700' : 'white'}
    >
      <Image
        src={character.avatar ? `http://localhost:3000${character.avatar}` : 'https://via.placeholder.com/300x200?text=No+Image'}
        alt={character.name}
        height="200px"
        objectFit="cover"
      />
      
      <CardBody>
        <Stack spacing={3}>
          <Heading size="md">{character.name}</Heading>
          
          <Flex wrap="wrap" gap={2}>
            {traits.map((trait, index) => (
              <Badge 
                key={index} 
                colorScheme={colorMode === 'dark' ? 'pink' : 'purple'}
                variant="subtle"
                px={2}
                py={1}
                borderRadius="full"
              >
                {trait}
              </Badge>
            ))}
          </Flex>
          
          <Text noOfLines={3}>
            {character.personality}
          </Text>
        </Stack>
      </CardBody>
      
      <Divider />
      
      <CardFooter>
        <Button 
          flex={1} 
          variant="solid" 
          colorScheme="brand"
          leftIcon={<ChatIcon />}
          onClick={() => onChat(character.id)}
        >
          Chat
        </Button>
        
        <IconButton
          aria-label="View memory"
          icon={<StarIcon />}
          ml={2}
          onClick={() => onMemory && onMemory(character.id)}
        />
        
        <IconButton
          aria-label="Export character"
          icon={<DownloadIcon />}
          ml={2}
          onClick={() => onExport && onExport(character.id)}
        />
        
        <IconButton
          aria-label="Edit character"
          icon={<EditIcon />}
          ml={2}
          onClick={() => onEdit(character)}
        />
        
        <IconButton
          aria-label="Delete character"
          icon={<DeleteIcon />}
          ml={2}
          colorScheme="red"
          onClick={() => onDelete(character.id)}
        />
      </CardFooter>
    </Card>
  );
};

export default CharacterCard;