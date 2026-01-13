import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Flex,
  Badge,
  Tooltip,
  useColorMode,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Progress,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  VStack,
  HStack,
  Icon,
  useToast
} from '@chakra-ui/react';
import { StarIcon, CheckCircleIcon, LockIcon, QuestionIcon } from '@chakra-ui/icons';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:3000/api';
const SOCKET_URL = 'http://localhost:3000';

const AchievementCard = ({ achievement, onClick }) => {
  const { colorMode } = useColorMode();
  
  // Determine card appearance based on unlock status
  const getBgColor = () => {
    if (achievement.unlocked) {
      return colorMode === 'dark' ? 'purple.700' : 'purple.100';
    }
    return colorMode === 'dark' ? 'gray.700' : 'gray.100';
  };
  
  const getTextColor = () => {
    if (achievement.unlocked) {
      return colorMode === 'dark' ? 'white' : 'purple.800';
    }
    return colorMode === 'dark' ? 'gray.300' : 'gray.500';
  };
  
  const getIcon = () => {
    if (achievement.unlocked) {
      return CheckCircleIcon;
    }
    return achievement.secret ? QuestionIcon : LockIcon;
  };
  
  return (
    <Box
      p={5}
      borderRadius="md"
      bg={getBgColor()}
      color={getTextColor()}
      cursor="pointer"
      onClick={() => onClick(achievement)}
      transition="transform 0.2s"
      _hover={{ transform: 'translateY(-5px)' }}
      position="relative"
      opacity={achievement.unlocked || !achievement.secret ? 1 : 0.8}
    >
      {achievement.secret && (
        <Badge 
          position="absolute" 
          top={2} 
          right={2} 
          colorScheme="yellow"
        >
          Tajné
        </Badge>
      )}
      
      <Flex align="center" mb={2}>
        <Text fontSize="3xl" mr={2}>{achievement.icon}</Text>
        <Icon as={getIcon()} color={achievement.unlocked ? 'green.500' : 'gray.500'} />
      </Flex>
      
      <Heading size="md" mb={2}>
        {achievement.unlocked || !achievement.secret 
          ? achievement.name 
          : "???"}
      </Heading>
      
      <Text fontSize="sm">
        {achievement.unlocked || !achievement.secret 
          ? achievement.description 
          : "Toto úspěch je třeba odemknout"}
      </Text>
      
      {achievement.unlocked && (
        <Text fontSize="xs" mt={2} color="gray.500">
          Odemčeno: {new Date(achievement.unlocked_at).toLocaleDateString()}
        </Text>
      )}
    </Box>
  );
};

const StatCard = ({ icon, label, value }) => {
  const { colorMode } = useColorMode();
  
  return (
    <Stat
      px={4}
      py={3}
      bg={colorMode === 'dark' ? 'gray.700' : 'white'}
      borderRadius="md"
      boxShadow="sm"
    >
      <Flex align="center">
        <Text fontSize="xl" mr={2}>{icon}</Text>
        <StatLabel>{label}</StatLabel>
      </Flex>
      <StatNumber fontSize="2xl">{value}</StatNumber>
    </Stat>
  );
};

const Achievements = () => {
  const { colorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSecret, setShowSecret] = useState(false);
  const toast = useToast();
  
  // Connect to socket for achievement notifications
  useEffect(() => {
    const socket = io(SOCKET_URL);
    
    socket.on('achievement-unlocked', (data) => {
      // Show notification
      toast({
        title: 'Úspěch odemčen!',
        description: `${data.achievement.name} - ${data.achievement.description}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
        icon: <Text fontSize="xl">{data.achievement.icon}</Text>
      });
      
      // Refresh achievements
      fetchAchievements();
    });
    
    return () => {
      socket.disconnect();
    };
  }, [toast]);
  
  // Fetch achievements and stats on component mount
  useEffect(() => {
    fetchAchievements();
    fetchStats();
  }, []);
  
  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/achievements`);
      setAchievements(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      setLoading(false);
    }
  };
  
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };
  
  const handleAchievementClick = (achievement) => {
    setSelectedAchievement(achievement);
    onOpen();
  };
  
  // Calculate achievement progress
  const calculateProgress = () => {
    if (!achievements.length) return 0;
    
    const unlocked = achievements.filter(a => a.unlocked).length;
    const total = achievements.length;
    
    return Math.round((unlocked / total) * 100);
  };
  
  // Group achievements by type
  const groupedAchievements = achievements.reduce((groups, achievement) => {
    if (!groups[achievement.type]) {
      groups[achievement.type] = [];
    }
    groups[achievement.type].push(achievement);
    return groups;
  }, {});
  
  // Format the type name
  const formatTypeName = (type) => {
    const typeMap = {
      'conversation': 'Konverzace',
      'character': 'Postavy',
      'roleplay': 'Role-Playing',
      'voice': 'Hlas',
      'image': 'Obrázky',
      'system': 'Systém'
    };
    
    return typeMap[type] || type;
  };
  
  return (
    <Box>
      <Heading size="lg" mb={6}>Úspěchy</Heading>
      
      {/* Progress Overview */}
      <Box 
        p={5} 
        mb={8} 
        borderRadius="lg" 
        bg={colorMode === 'dark' ? 'gray.700' : 'white'} 
        boxShadow="md"
      >
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md">Celkový postup</Heading>
          <Text fontWeight="bold">
            {achievements.filter(a => a.unlocked).length} / {achievements.length} odemčeno
          </Text>
        </Flex>
        
        <Progress 
          value={calculateProgress()} 
          size="lg" 
          colorScheme="green" 
          borderRadius="full" 
          mb={4}
        />
        
        {/* Stats Overview */}
        <StatGroup mt={6}>
          <StatCard 
            icon="💬" 
            label="Zprávy" 
            value={stats.messages || 0} 
          />
          
          <StatCard 
            icon="👤" 
            label="Postavy" 
            value={stats.characters_created || 0} 
          />
          
          <StatCard 
            icon="📖" 
            label="Scénáře" 
            value={stats.scenarios_created || 0} 
          />
          
          <StatCard 
            icon="🎨" 
            label="Obrázky" 
            value={stats.images_generated || 0} 
          />
        </StatGroup>
      </Box>
      
      {/* Achievement Categories */}
      {Object.keys(groupedAchievements).map(type => (
        <Box key={type} mb={8}>
          <Heading size="md" mb={4}>{formatTypeName(type)}</Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {groupedAchievements[type]
              .filter(achievement => showSecret || achievement.unlocked || !achievement.secret)
              .map(achievement => (
                <AchievementCard 
                  key={achievement.id} 
                  achievement={achievement} 
                  onClick={handleAchievementClick}
                />
              ))}
          </SimpleGrid>
        </Box>
      ))}
      
      {/* Achievement Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Detail úspěchu</ModalHeader>
          <ModalCloseButton />
          
          <ModalBody pb={6}>
            {selectedAchievement && (
              <VStack align="start" spacing={4}>
                <HStack>
                  <Text fontSize="3xl">{selectedAchievement.icon}</Text>
                  <Heading size="md">{selectedAchievement.name}</Heading>
                </HStack>
                
                <Text>{selectedAchievement.description}</Text>
                
                {selectedAchievement.secret && (
                  <Badge colorScheme="yellow">Tajný úspěch</Badge>
                )}
                
                {selectedAchievement.unlocked ? (
                  <Text fontSize="sm" color="green.500">
                    Odemčeno: {new Date(selectedAchievement.unlocked_at).toLocaleString()}
                  </Text>
                ) : (
                  <Text fontSize="sm" color="gray.500">
                    Zamčeno
                  </Text>
                )}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Achievements;