import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Badge,
  Divider,
  useColorMode,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Input,
  FormControl,
  FormLabel,
  Textarea,
  Select,
  Flex,
  IconButton,
  Image,
  Card,
  CardBody,
  CardHeader,
  RadioGroup,
  Radio,
  Stack,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon, StarIcon, ChevronRightIcon } from '@chakra-ui/icons';
import apiClient from '../utils/ApiClient';

const RolePlaying = () => {
  const { colorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isStoryBranchOpen, 
    onOpen: onStoryBranchOpen, 
    onClose: onStoryBranchClose 
  } = useDisclosure();
  
  // Toast pro notifikace
  const toast = useToast();
  
  // State pro data
  const [scenarios, setScenarios] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Načtení dat při inicializaci komponenty
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Načtení uživatelského ID z localStorage
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        const userId = userData.id;
        
        if (!userId) {
          setError('Pro použití této funkce je potřeba se přihlásit');
          setIsLoading(false);
          return;
        }
        
        // Načtení scénářů
        const scenariosResponse = await apiClient.get(`/users/${userId}/scenarios`);
        if (scenariosResponse.success && scenariosResponse.scenarios) {
          setScenarios(scenariosResponse.scenarios);
        } else {
          // Pokud není API endpoint ještě implementován, použijeme demonstrační data
          setScenarios([
            {
              id: 'scenario-1',
              title: 'Náhodné setkání',
              description: 'Potkáváš Sakuru v kavárně. Je to vaše první setkání.',
              tags: ['Romantika', 'První setkání', 'Kavárna'],
              character: 'Sakura',
              characterId: 'char-demo-1',
              userId: userId,
              createdAt: Date.now() - 86400000,
              updatedAt: Date.now() - 86400000,
              branches: [
                {
                  id: 'branch-1-1',
                  title: 'Představení',
                  description: 'Představíš se a začnete si povídat.',
                  outcomes: [
                    {
                      id: 'outcome-1-1-1',
                      text: 'Sakura se zasměje a začne se bavit o anime.',
                      nextBranches: ['branch-1-2', 'branch-1-3']
                    }
                  ]
                },
                {
                  id: 'branch-1-2',
                  title: 'Rozhovor o anime',
                  description: 'Probíráte vaše oblíbené anime série.',
                  outcomes: [
                    {
                      id: 'outcome-1-2-1',
                      text: 'Sakura nadšeně mluví o svém oblíbeném anime.',
                      nextBranches: ['branch-1-4']
                    }
                  ]
                },
                {
                  id: 'branch-1-3',
                  title: 'Rozhovor o programování',
                  description: 'Zjistíte, že oba máte rádi programování.',
                  outcomes: [
                    {
                      id: 'outcome-1-3-1',
                      text: 'Sakura ti ukazuje svůj GitHub profil.',
                      nextBranches: ['branch-1-4']
                    }
                  ]
                },
                {
                  id: 'branch-1-4',
                  title: 'Výměna kontaktů',
                  description: 'Vyměníte si kontakty a domluvíte se na další setkání.',
                  outcomes: [
                    {
                      id: 'outcome-1-4-1',
                      text: 'Sakura ti dá své číslo a rozloučí se.',
                      nextBranches: []
                    }
                  ]
                }
              ]
            },
            {
              id: 'scenario-2',
              title: 'Společné programování',
              description: 'Sakura tě požádala o pomoc s jejím projektem. Pracujete spolu na vývoji aplikace.',
              tags: ['Technologie', 'Spolupráce', 'Kódování'],
              character: 'Sakura',
              characterId: 'char-demo-1',
              userId: userId,
              createdAt: Date.now() - 172800000,
              updatedAt: Date.now() - 172800000,
              branches: [
                {
                  id: 'branch-2-1',
                  title: 'Začátek projektu',
                  description: 'Diskutujete o technologiích, které chcete použít.',
                  outcomes: [
                    {
                      id: 'outcome-2-1-1',
                      text: 'Rozhodnete se pro React a Node.js.',
                      nextBranches: ['branch-2-2', 'branch-2-3']
                    }
                  ]
                },
                {
                  id: 'branch-2-2',
                  title: 'Frontend vývoj',
                  description: 'Pracujete na React komponentách.',
                  outcomes: [
                    {
                      id: 'outcome-2-2-1',
                      text: 'Vytvoříte základní UI a Sakura je nadšená.',
                      nextBranches: ['branch-2-4']
                    }
                  ]
                },
                {
                  id: 'branch-2-3',
                  title: 'Backend vývoj',
                  description: 'Pracujete na Node.js API.',
                  outcomes: [
                    {
                      id: 'outcome-2-3-1',
                      text: 'Navrhnete databázové schéma a API endpointy.',
                      nextBranches: ['branch-2-4']
                    }
                  ]
                },
                {
                  id: 'branch-2-4',
                  title: 'Dokončení projektu',
                  description: 'Spojíte frontend a backend a otestujete aplikaci.',
                  outcomes: [
                    {
                      id: 'outcome-2-4-1',
                      text: 'Aplikace funguje skvěle. Sakura je nadšená a pozve tě na večeři jako poděkování.',
                      nextBranches: []
                    }
                  ]
                }
              ]
            }
          ]);
        }
        
        // Načtení postav
        try {
          const charactersResponse = await apiClient.getCharacters(userId);
          if (charactersResponse.success && charactersResponse.characters) {
            setCharacters(charactersResponse.characters);
          }
        } catch (err) {
          console.error('Chyba při načítání postav:', err);
          // Pokud selže načtení postav, použijeme demonstrační data
          setCharacters([
            {
              id: 'char-demo-1',
              name: 'Sakura',
              personality: 'Sakura je přátelská, energická a zvědavá dívka s vášní pro anime a technologie. Má smysl pro humor a ráda poznává nové lidi.',
              appearance: 'Sakura má růžové vlasy, modré oči a často nosí školní uniformu nebo casual oblečení s anime motivy.'
            },
            {
              id: 'char-demo-2',
              name: 'Alex',
              personality: 'Alex je klidný, přemýšlivý a analytický. Má hluboké znalosti o technologiích a sci-fi. Je spíše introvertní, ale velmi loajální k přátelům.',
              appearance: 'Alex má krátké hnědé vlasy, nosí brýle a většinou je oblečený v jednoduchém, praktickém oblečení.'
            }
          ]);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Chyba při načítání dat:', err);
        setError('Došlo k chybě při načítání dat');
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // State for new/edit scenario
  const [currentScenario, setCurrentScenario] = useState({
    title: '',
    description: '',
    tags: [],
    character: 'Sakura',
    branches: []
  });
  
  // State for tags input
  const [tagsInput, setTagsInput] = useState('');
  
  // Current branch for story branching editor
  const [currentBranch, setCurrentBranch] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [storyBranchView, setStoryBranchView] = useState('diagram'); // 'diagram' or 'edit'
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentScenario({ ...currentScenario, [name]: value });
  };
  
  // Handle tags input
  const handleTagsChange = (e) => {
    setTagsInput(e.target.value);
    const tagsArray = e.target.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '');
    
    setCurrentScenario({ ...currentScenario, tags: tagsArray });
  };
  
  // Create new scenario
  const createScenario = () => {
    const newScenario = {
      id: `scenario-${Date.now()}`,
      ...currentScenario,
      branches: [
        {
          id: `branch-${Date.now()}-1`,
          title: 'Začátek',
          description: 'Úvodní situace scénáře.',
          outcomes: [
            {
              id: `outcome-${Date.now()}-1-1`,
              text: 'První reakce postavy.',
              nextBranches: []
            }
          ]
        }
      ]
    };
    
    setScenarios([...scenarios, newScenario]);
    onClose();
    
    // Reset form
    setCurrentScenario({
      title: '',
      description: '',
      tags: [],
      character: 'Sakura',
      branches: []
    });
    setTagsInput('');
  };
  
  // Open story branching editor
  const openStoryBranching = (scenario) => {
    setSelectedScenario(scenario);
    setStoryBranchView('diagram');
    onStoryBranchOpen();
  };
  
  // Add new branch to scenario
  const addBranch = () => {
    if (!selectedScenario || !currentBranch) return;
    
    const newBranch = {
      id: `branch-${Date.now()}`,
      title: currentBranch.title,
      description: currentBranch.description,
      outcomes: [
        {
          id: `outcome-${Date.now()}-1`,
          text: currentBranch.outcomeText,
          nextBranches: []
        }
      ]
    };
    
    // Update the selected scenario with the new branch
    const updatedScenarios = scenarios.map(s => {
      if (s.id === selectedScenario.id) {
        return {
          ...s,
          branches: [...s.branches, newBranch]
        };
      }
      return s;
    });
    
    setScenarios(updatedScenarios);
    setSelectedScenario(updatedScenarios.find(s => s.id === selectedScenario.id));
    setCurrentBranch(null);
  };
  
  // Connect branches
  const connectBranches = (sourceBranchId, targetBranchId) => {
    if (!selectedScenario) return;
    
    const updatedScenarios = scenarios.map(s => {
      if (s.id === selectedScenario.id) {
        const updatedBranches = s.branches.map(branch => {
          if (branch.id === sourceBranchId) {
            // Add the target branch to the outcomes of the source branch
            const updatedOutcomes = branch.outcomes.map(outcome => ({
              ...outcome,
              nextBranches: [...outcome.nextBranches, targetBranchId]
            }));
            
            return {
              ...branch,
              outcomes: updatedOutcomes
            };
          }
          return branch;
        });
        
        return {
          ...s,
          branches: updatedBranches
        };
      }
      return s;
    });
    
    setScenarios(updatedScenarios);
    setSelectedScenario(updatedScenarios.find(s => s.id === selectedScenario.id));
  };
  
  // Vytvoření nového scénáře s reálnou API komunikací
  const createScenario = async () => {
    try {
      // Získání uživatelského ID z localStorage
      const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
      const userId = userData.id;
      
      if (!userId) {
        toast({
          title: 'Chyba',
          description: 'Pro vytvoření scénáře je potřeba se přihlásit',
          status: 'error',
          duration: 5000,
          isClosable: true
        });
        return;
      }
      
      // Příprava dat scénáře
      const newScenarioData = {
        userId,
        title: currentScenario.title,
        description: currentScenario.description,
        characterId: currentScenario.character,
        tags: currentScenario.tags,
        branches: [
          {
            id: `branch-${Date.now()}-1`,
            title: 'Začátek',
            description: 'Úvodní situace scénáře.',
            outcomes: [
              {
                id: `outcome-${Date.now()}-1-1`,
                text: 'První reakce postavy.',
                nextBranches: []
              }
            ]
          }
        ]
      };
      
      // Odeslání požadavku na API
      setIsLoading(true);
      
      try {
        // Zkusíme použít API endpoint, pokud existuje
        const response = await apiClient.post('/scenarios', newScenarioData);
        
        if (response.success && response.scenario) {
          // Přidání nového scénáře do seznamu
          setScenarios([...scenarios, response.scenario]);
          
          toast({
            title: 'Úspěch',
            description: 'Scénář byl úspěšně vytvořen',
            status: 'success',
            duration: 5000,
            isClosable: true
          });
        } else {
          throw new Error('Chyba při vytváření scénáře');
        }
      } catch (err) {
        console.error('API endpoint neexistuje nebo došlo k chybě, používám alternativní řešení:', err);
        
        // Simulace odpovědi API - v produkci by zde byla reálná API komunikace
        const newScenario = {
          id: `scenario-${Date.now()}`,
          userId,
          title: currentScenario.title,
          description: currentScenario.description,
          character: Array.isArray(currentScenario.character) ? 
            currentScenario.character[0] : 
            currentScenario.character,
          characterId: currentScenario.character,
          tags: currentScenario.tags,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          branches: [
            {
              id: `branch-${Date.now()}-1`,
              title: 'Začátek',
              description: 'Úvodní situace scénáře.',
              outcomes: [
                {
                  id: `outcome-${Date.now()}-1-1`,
                  text: 'První reakce postavy.',
                  nextBranches: []
                }
              ]
            }
          ]
        };
        
        // Přidání nového scénáře do seznamu
        setScenarios([...scenarios, newScenario]);
        
        toast({
          title: 'Úspěch',
          description: 'Scénář byl úspěšně vytvořen (demo režim)',
          status: 'success',
          duration: 5000,
          isClosable: true
        });
      }
      
      setIsLoading(false);
      onClose();
      
      // Reset formuláře
      setCurrentScenario({
        title: '',
        description: '',
        tags: [],
        character: characters.length > 0 ? characters[0].id : '',
        branches: []
      });
      setTagsInput('');
    } catch (error) {
      console.error('Chyba při vytváření scénáře:', error);
      
      toast({
        title: 'Chyba',
        description: 'Při vytváření scénáře došlo k chybě',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
      
      setIsLoading(false);
    }
  };
  
  // Spuštění scénáře
  const startScenario = async (scenario) => {
    try {
      // Získání uživatelského ID z localStorage
      const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
      const userId = userData.id;
      
      if (!userId) {
        toast({
          title: 'Chyba',
          description: 'Pro spuštění scénáře je potřeba se přihlásit',
          status: 'error',
          duration: 5000,
          isClosable: true
        });
        return;
      }
      
      // Vytvoření nové konverzace se scénářem
      setIsLoading(true);
      
      try {
        // Zkusíme použít API endpoint, pokud existuje
        const response = await apiClient.post('/conversations', {
          userId,
          characterId: scenario.characterId,
          title: `Role-playing: ${scenario.title}`,
          scenarioId: scenario.id
        });
        
        if (response.success && response.id) {
          // Přesměrování na stránku chatu s novou konverzací
          window.location.href = `/chat/${response.id}?scenario=${scenario.id}`;
        } else {
          throw new Error('Chyba při vytváření konverzace');
        }
      } catch (err) {
        console.error('API endpoint neexistuje nebo došlo k chybě, používám alternativní řešení:', err);
        
        // Simulace odpovědi API - v produkci by zde byla reálná API komunikace
        window.location.href = `/chat/new?scenario=${scenario.id}&character=${scenario.characterId}`;
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Chyba při spouštění scénáře:', error);
      
      toast({
        title: 'Chyba',
        description: 'Při spouštění scénáře došlo k chybě',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
      
      setIsLoading(false);
    }
  };
  
  // Edit branch form component
  const EditBranchForm = () => {
    const [branchForm, setBranchForm] = useState({
      title: '',
      description: '',
      outcomeText: ''
    });
    
    const handleBranchFormChange = (e) => {
      const { name, value } = e.target;
      setBranchForm({ ...branchForm, [name]: value });
    };
    
    const saveBranch = () => {
      setCurrentBranch(branchForm);
      addBranch();
      setBranchForm({
        title: '',
        description: '',
        outcomeText: ''
      });
    };
    
    return (
      <VStack spacing={4} align="stretch">
        <FormControl isRequired>
          <FormLabel>Název větve</FormLabel>
          <Input 
            name="title"
            value={branchForm.title}
            onChange={handleBranchFormChange}
            placeholder="Název větve příběhu"
          />
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Popis situace</FormLabel>
          <Textarea 
            name="description"
            value={branchForm.description}
            onChange={handleBranchFormChange}
            placeholder="Popis situace v této části příběhu..."
            rows={3}
          />
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Text výsledku</FormLabel>
          <Textarea 
            name="outcomeText"
            value={branchForm.outcomeText}
            onChange={handleBranchFormChange}
            placeholder="Co se stane po této části příběhu..."
            rows={2}
          />
        </FormControl>
        
        <Button 
          colorScheme="brand" 
          onClick={saveBranch}
          isDisabled={!branchForm.title || !branchForm.description || !branchForm.outcomeText}
        >
          Přidat větev
        </Button>
      </VStack>
    );
  };
  
  // Branch connector component
  const BranchConnector = () => {
    const [sourceBranch, setSourceBranch] = useState('');
    const [targetBranch, setTargetBranch] = useState('');
    
    const handleConnect = () => {
      if (sourceBranch && targetBranch && sourceBranch !== targetBranch) {
        connectBranches(sourceBranch, targetBranch);
        setSourceBranch('');
        setTargetBranch('');
      }
    };
    
    return (
      <VStack spacing={4} align="stretch" mt={4}>
        <Heading size="sm">Propojit větve</Heading>
        
        <FormControl>
          <FormLabel>Z větve:</FormLabel>
          <Select 
            value={sourceBranch}
            onChange={(e) => setSourceBranch(e.target.value)}
            placeholder="Vyberte výchozí větev"
          >
            {selectedScenario?.branches.map(branch => (
              <option key={branch.id} value={branch.id}>{branch.title}</option>
            ))}
          </Select>
        </FormControl>
        
        <FormControl>
          <FormLabel>Do větve:</FormLabel>
          <Select 
            value={targetBranch}
            onChange={(e) => setTargetBranch(e.target.value)}
            placeholder="Vyberte cílovou větev"
          >
            {selectedScenario?.branches.map(branch => (
              <option key={branch.id} value={branch.id}>{branch.title}</option>
            ))}
          </Select>
        </FormControl>
        
        <Button 
          colorScheme="blue" 
          onClick={handleConnect}
          isDisabled={!sourceBranch || !targetBranch || sourceBranch === targetBranch}
        >
          Propojit větve
        </Button>
      </VStack>
    );
  };
  
  // Branch detail view
  const BranchDetail = ({ branch }) => {
    if (!branch) return null;
    
    return (
      <Box 
        p={4} 
        borderWidth="1px" 
        borderRadius="md" 
        bg={colorMode === 'dark' ? 'gray.700' : 'white'}
      >
        <Heading size="md" mb={2}>{branch.title}</Heading>
        <Text mb={4}>{branch.description}</Text>
        
        <Divider mb={4} />
        
        <Heading size="sm" mb={2}>Výsledky:</Heading>
        <VStack align="stretch" spacing={2}>
          {branch.outcomes.map(outcome => (
            <Box key={outcome.id} p={2} bg={colorMode === 'dark' ? 'gray.600' : 'gray.50'} borderRadius="md">
              <Text mb={2}>{outcome.text}</Text>
              
              {outcome.nextBranches.length > 0 ? (
                <VStack align="stretch" mt={2}>
                  <Text fontWeight="bold" fontSize="sm">Vede k:</Text>
                  {outcome.nextBranches.map(nextBranchId => {
                    const nextBranch = selectedScenario?.branches.find(b => b.id === nextBranchId);
                    return (
                      <Text key={nextBranchId} fontSize="sm" color="brand.500">
                        → {nextBranch?.title || 'Neznámá větev'}
                      </Text>
                    );
                  })}
                </VStack>
              ) : (
                <Text fontSize="sm" color="gray.500" mt={2}>Konec příběhu</Text>
              )}
            </Box>
          ))}
        </VStack>
      </Box>
    );
  };

  // Odstranění scénáře
  const deleteScenario = async (scenarioId) => {
    try {
      if (!window.confirm('Opravdu chcete odstranit tento scénář?')) {
        return;
      }
      
      // Získání uživatelského ID z localStorage
      const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
      const userId = userData.id;
      
      if (!userId) {
        toast({
          title: 'Chyba',
          description: 'Pro odstranění scénáře je potřeba se přihlásit',
          status: 'error',
          duration: 5000,
          isClosable: true
        });
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Zkusíme použít API endpoint, pokud existuje
        const response = await apiClient.delete(`/scenarios/${scenarioId}`);
        
        if (response.success) {
          // Odstranění scénáře ze seznamu
          setScenarios(scenarios.filter(scenario => scenario.id !== scenarioId));
          
          toast({
            title: 'Úspěch',
            description: 'Scénář byl úspěšně odstraněn',
            status: 'success',
            duration: 5000,
            isClosable: true
          });
        } else {
          throw new Error('Chyba při odstraňování scénáře');
        }
      } catch (err) {
        console.error('API endpoint neexistuje nebo došlo k chybě, používám alternativní řešení:', err);
        
        // Simulace odstranění scénáře - v produkci by zde byla reálná API komunikace
        setScenarios(scenarios.filter(scenario => scenario.id !== scenarioId));
        
        toast({
          title: 'Úspěch',
          description: 'Scénář byl úspěšně odstraněn (demo režim)',
          status: 'success',
          duration: 5000,
          isClosable: true
        });
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Chyba při odstraňování scénáře:', error);
      
      toast({
        title: 'Chyba',
        description: 'Při odstraňování scénáře došlo k chybě',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
      
      setIsLoading(false);
    }
  };
  
  // Změna oblíbeného scénáře
  const toggleFavorite = async (scenario) => {
    try {
      // Získání uživatelského ID z localStorage
      const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
      const userId = userData.id;
      
      if (!userId) {
        toast({
          title: 'Chyba',
          description: 'Pro označení scénáře jako oblíbeného je potřeba se přihlásit',
          status: 'error',
          duration: 5000,
          isClosable: true
        });
        return;
      }
      
      const isFavorite = scenario.isFavorite || false;
      
      try {
        // Zkusíme použít API endpoint, pokud existuje
        const response = await apiClient.put(`/scenarios/${scenario.id}`, {
          isFavorite: !isFavorite
        });
        
        if (response.success) {
          // Aktualizace scénáře v seznamu
          setScenarios(scenarios.map(s => 
            s.id === scenario.id ? { ...s, isFavorite: !isFavorite } : s
          ));
          
          toast({
            title: 'Úspěch',
            description: !isFavorite ? 
              'Scénář byl přidán mezi oblíbené' : 
              'Scénář byl odebrán z oblíbených',
            status: 'success',
            duration: 3000,
            isClosable: true
          });
        } else {
          throw new Error('Chyba při aktualizaci scénáře');
        }
      } catch (err) {
        console.error('API endpoint neexistuje nebo došlo k chybě, používám alternativní řešení:', err);
        
        // Simulace aktualizace scénáře - v produkci by zde byla reálná API komunikace
        setScenarios(scenarios.map(s => 
          s.id === scenario.id ? { ...s, isFavorite: !isFavorite } : s
        ));
      }
    } catch (error) {
      console.error('Chyba při aktualizaci oblíbeného stavu:', error);
      
      toast({
        title: 'Chyba',
        description: 'Při aktualizaci oblíbeného stavu došlo k chybě',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Role-Playing Scénáře</Heading>
        <Button 
          leftIcon={<AddIcon />} 
          colorScheme="brand"
          onClick={onOpen}
          isDisabled={isLoading}
        >
          Nový scénář
        </Button>
      </Flex>
      
      <Text mb={6} color="gray.500">
        Role-Playing Engine s větvením příběhu umožňuje vytvářet interaktivní scénáře s různými cestami a výsledky.
      </Text>
      
      {error && (
        <Alert status="error" mb={6}>
          <AlertIcon />
          <AlertTitle mr={2}>Chyba!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {isLoading ? (
        <Flex justifyContent="center" alignItems="center" minH="200px">
          <Spinner size="xl" color="brand.500" />
        </Flex>
      ) : (
        <VStack spacing={4} align="stretch">
          {scenarios.map(scenario => (
            <Card 
              key={scenario.id}
              variant="outline"
              bg={colorMode === 'dark' ? 'gray.700' : 'white'}
            >
              <CardHeader>
                <Flex justify="space-between" align="center">
                  <Heading size="md">{scenario.title}</Heading>
                  <HStack>
                    <IconButton
                      icon={<StarIcon />}
                      variant="ghost"
                      aria-label="Favorite"
                      colorScheme={scenario.isFavorite ? "yellow" : "gray"}
                      onClick={() => toggleFavorite(scenario)}
                    />
                    <IconButton
                      icon={<EditIcon />}
                      variant="ghost"
                      aria-label="Edit"
                      onClick={() => {
                        // V budoucí implementaci by zde byla funkce pro editaci scénáře
                        toast({
                          title: 'Info',
                          description: 'Editace scénáře je dostupná v plné verzi',
                          status: 'info',
                          duration: 3000,
                          isClosable: true
                        });
                      }}
                    />
                    <IconButton
                      icon={<DeleteIcon />}
                      variant="ghost"
                      aria-label="Delete"
                      colorScheme="red"
                      onClick={() => deleteScenario(scenario.id)}
                    />
                  </HStack>
                </Flex>
              </CardHeader>
              
              <CardBody>
                <Text mb={4}>{scenario.description}</Text>
                
                <HStack mb={4}>
                  <Text fontWeight="bold">Postava:</Text>
                  <Badge colorScheme="pink">
                    {characters.find(c => c.id === scenario.characterId)?.name || scenario.character}
                  </Badge>
                </HStack>
                
                <HStack mb={4} wrap="wrap">
                  {scenario.tags && scenario.tags.map((tag, index) => (
                    <Badge key={index} colorScheme="purple" m={1}>
                      {tag}
                    </Badge>
                  ))}
                </HStack>
                
                <Box mb={4}>
                  <Text fontWeight="bold" mb={2}>
                    Počet větví příběhu: {scenario.branches ? scenario.branches.length : 0}
                  </Text>
                  <Button 
                    size="sm" 
                    rightIcon={<ChevronRightIcon />} 
                    onClick={() => openStoryBranching(scenario)}
                    colorScheme="blue"
                    variant="outline"
                  >
                    Upravit větvení příběhu
                  </Button>
                </Box>
                
                <Button
                  colorScheme="brand"
                  onClick={() => startScenario(scenario)}
                  width="full"
                  isDisabled={isLoading}
                >
                  Spustit scénář
                </Button>
              </CardBody>
            </Card>
          ))}
          
          {scenarios.length === 0 && !isLoading && (
            <Box 
              p={10} 
              textAlign="center" 
              borderRadius="md" 
              bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'}
            >
              <Text mb={4}>Zatím nemáte žádné scénáře.</Text>
              <Button 
                leftIcon={<AddIcon />} 
                colorScheme="brand"
                onClick={onOpen}
              >
                Vytvořit první scénář
              </Button>
            </Box>
          )}
        </VStack>
      )}
      </VStack>
      
      {/* Create/Edit Scenario Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Vytvořit nový scénář</ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            {isLoading ? (
              <Flex justifyContent="center" py={8}>
                <Spinner size="xl" color="brand.500" />
              </Flex>
            ) : (
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Název</FormLabel>
                  <Input 
                    name="title"
                    value={currentScenario.title}
                    onChange={handleInputChange}
                    placeholder="Název scénáře"
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Popis</FormLabel>
                  <Textarea 
                    name="description"
                    value={currentScenario.description}
                    onChange={handleInputChange}
                    placeholder="Popis scénáře a základní situace..."
                    rows={4}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Tagy (oddělené čárkou)</FormLabel>
                  <Input 
                    value={tagsInput}
                    onChange={handleTagsChange}
                    placeholder="Romantika, Dobrodružství, Technologie..."
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Postava</FormLabel>
                  <Select 
                    name="character"
                    value={currentScenario.character}
                    onChange={handleInputChange}
                  >
                    {characters.length > 0 ? (
                      characters.map(character => (
                        <option key={character.id} value={character.id}>
                          {character.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="char-demo-1">Sakura</option>
                        <option value="char-demo-2">Alex</option>
                      </>
                    )}
                  </Select>
                </FormControl>
                
                <Text fontSize="sm" color="gray.500">
                  Po vytvoření scénáře budete moci nastavit větve příběhu.
                </Text>
              </VStack>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isLoading}>
              Zrušit
            </Button>
            <Button 
              colorScheme="brand" 
              onClick={createScenario}
              isLoading={isLoading}
              loadingText="Vytvářím..."
              isDisabled={isLoading || !currentScenario.title || !currentScenario.description || !currentScenario.character}
            >
              Vytvořit
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Story Branching Modal */}
      <Modal isOpen={isStoryBranchOpen} onClose={onStoryBranchClose} size="xl">
        <ModalOverlay />
        <ModalContent maxW="900px">
          <ModalHeader>
            Větvení příběhu: {selectedScenario?.title}
            <RadioGroup onChange={setStoryBranchView} value={storyBranchView} size="sm">
              <Stack direction="row" mt={2}>
                <Radio value="diagram">Diagram</Radio>
                <Radio value="edit">Přidat větev</Radio>
              </Stack>
            </RadioGroup>
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            {isLoading ? (
              <Flex justifyContent="center" py={8}>
                <Spinner size="xl" color="brand.500" />
              </Flex>
            ) : (
              storyBranchView === 'diagram' ? (
                <Box>
                  <Text mb={4}>Diagram větvení příběhu:</Text>
                  
                  <Accordion allowMultiple defaultIndex={[0]}>
                    {selectedScenario?.branches.map((branch, index) => (
                      <AccordionItem key={branch.id}>
                        <h2>
                          <AccordionButton 
                            py={3}
                            bg={selectedBranchId === branch.id ? (colorMode === 'dark' ? 'purple.700' : 'purple.100') : undefined}
                            onClick={() => setSelectedBranchId(branch.id)}
                          >
                            <Box flex="1" textAlign="left">
                              <Text fontWeight="bold">{branch.title}</Text>
                            </Box>
                            <AccordionIcon />
                          </AccordionButton>
                        </h2>
                        <AccordionPanel pb={4}>
                          <BranchDetail branch={branch} />
                        </AccordionPanel>
                      </AccordionItem>
                    ))}
                  </Accordion>
                  
                  <BranchConnector />
                </Box>
              ) : (
                <Box>
                  <Text mb={4}>Přidat novou větev příběhu:</Text>
                  <EditBranchForm />
                </Box>
              )
            )}
          </ModalBody>

          <ModalFooter>
            <Button 
              colorScheme="blue" 
              mr={3} 
              onClick={onStoryBranchClose}
              isDisabled={isLoading}
            >
              Hotovo
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default RolePlaying;