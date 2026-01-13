import React from 'react';
import {
  Box,
  Heading,
  Progress,
  Text,
  Flex,
  Badge,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  List,
  ListItem,
  ListIcon,
  useColorMode
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';

const ProgressTracker = () => {
  const { colorMode } = useColorMode();
  
  // Define all phases and their tasks
  const phases = [
    {
      name: 'Příprava prostředí',
      tasks: [
        { name: 'Docker & AI Modely Setup', completed: true },
        { name: 'Necenzurované modely', completed: true },
        { name: 'Docker-compose konfigurace', completed: true },
        { name: 'Testování běhu kontejnerů', completed: false }
      ]
    },
    {
      name: 'Základní aplikace',
      tasks: [
        { name: 'Frontend Setup (Electron + React)', completed: true },
        { name: 'Backend API (Express + SQLite)', completed: true },
        { name: 'Základní UI komponenty', completed: true },
        { name: 'Implementace routingu', completed: true }
      ]
    },
    {
      name: 'AI Integrace',
      tasks: [
        { name: 'LLM Konverzace (Ollama API)', completed: true },
        { name: 'Generování obrázků (Stable Diffusion)', completed: true },
        { name: 'Streaming responses', completed: true },
        { name: 'Systém pro udržení kontextu', completed: true }
      ]
    },
    {
      name: 'Správa postav',
      tasks: [
        { name: 'Character Creation', completed: true },
        { name: 'Personality Traits System', completed: true },
        { name: 'Character Memory', completed: true },
        { name: 'Export/Import postav', completed: true }
      ]
    },
    {
      name: 'Pokročilé funkce',
      tasks: [
        { name: 'Voice & Audio (Coqui TTS)', completed: true },
        { name: 'Role-Play Engine', completed: true },
        { name: 'Story Branching', completed: true },
        { name: 'Achievement systém', completed: true }
      ]
    },
    {
      name: 'Optimalizace & UI/UX',
      tasks: [
        { name: 'Performance Optimalizace', completed: true },
        { name: 'Model Swapping System', completed: true },
        { name: 'Dark/Light Theme', completed: true },
        { name: 'Responsive Design', completed: true }
      ]
    },
    {
      name: 'Finalizace',
      tasks: [
        { name: 'Testing & Debugging', completed: true },
        { name: 'Deployment (Windows Installer)', completed: true },
        { name: 'Dokumentace', completed: false },
        { name: 'Update mechanismus', completed: false }
      ]
    }
  ];
  
  // Calculate total progress
  const getTotalProgress = () => {
    let completed = 0;
    let total = 0;
    
    phases.forEach(phase => {
      phase.tasks.forEach(task => {
        total++;
        if (task.completed) completed++;
      });
    });
    
    return {
      completed,
      total,
      percentage: Math.round((completed / total) * 100)
    };
  };
  
  // Calculate phase-specific progress
  const getPhaseProgress = (phase) => {
    const completed = phase.tasks.filter(task => task.completed).length;
    const total = phase.tasks.length;
    
    return {
      completed,
      total,
      percentage: Math.round((completed / total) * 100)
    };
  };
  
  const progress = getTotalProgress();

  return (
    <Box 
      p={5} 
      borderRadius="lg" 
      bg={colorMode === 'dark' ? 'gray.700' : 'white'} 
      boxShadow="md"
    >
      <Heading size="md" mb={4}>
        Stav projektu
      </Heading>
      
      <Flex align="center" mb={4}>
        <Text fontSize="xl" fontWeight="bold" mr={2}>
          {progress.percentage}%
        </Text>
        <Progress 
          value={progress.percentage} 
          size="lg" 
          colorScheme="brand" 
          flex="1" 
          borderRadius="full"
        />
      </Flex>
      
      <Text mb={4}>
        Dokončeno {progress.completed} z {progress.total} úkolů
      </Text>
      
      <Accordion allowMultiple defaultIndex={[0]}>
        {phases.map((phase, index) => {
          const phaseProgress = getPhaseProgress(phase);
          
          return (
            <AccordionItem key={index}>
              <h2>
                <AccordionButton py={3}>
                  <Box flex="1" textAlign="left">
                    <Flex align="center">
                      <Text fontWeight="bold">{phase.name}</Text>
                      <Badge 
                        ml={2} 
                        colorScheme={phaseProgress.percentage === 100 ? "green" : 
                                   phaseProgress.percentage > 0 ? "yellow" : "gray"}
                      >
                        {phaseProgress.completed}/{phaseProgress.total}
                      </Badge>
                    </Flex>
                  </Box>
                  
                  <Progress 
                    value={phaseProgress.percentage} 
                    size="sm" 
                    width="100px" 
                    colorScheme={phaseProgress.percentage === 100 ? "green" : "brand"} 
                    mr={4}
                    borderRadius="full"
                  />
                  
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                <List spacing={2}>
                  {phase.tasks.map((task, taskIndex) => (
                    <ListItem key={taskIndex}>
                      <ListIcon 
                        as={task.completed ? CheckCircleIcon : WarningIcon} 
                        color={task.completed ? "green.500" : "yellow.500"} 
                      />
                      {task.name}
                    </ListItem>
                  ))}
                </List>
              </AccordionPanel>
            </AccordionItem>
          );
        })}
      </Accordion>
    </Box>
  );
};

export default ProgressTracker;