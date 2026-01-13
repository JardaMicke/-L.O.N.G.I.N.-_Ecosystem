import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Flex,
  Button,
  IconButton,
  useToast,
  HStack,
  Text,
  useColorMode,
  Progress
} from '@chakra-ui/react';
import {
  RepeatIcon,
  CloseIcon,
  CheckIcon,
  DownloadIcon
} from '@chakra-ui/icons';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const AudioManager = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [voiceProfiles, setVoiceProfiles] = useState([]);
  const [audioQueue, setAudioQueue] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);
  const toast = useToast();
  const { colorMode } = useColorMode();

  // Check TTS service availability and load voice profiles on component mount
  useEffect(() => {
    checkTTSAvailability();
  }, []);

  // Setup audio player and progress tracking
  useEffect(() => {
    if (audioQueue.length > 0 && !isPlaying && !currentAudio) {
      // Play next in queue
      const nextAudio = audioQueue[0];
      setCurrentAudio(nextAudio);
      playAudio(nextAudio.url);
    }
  }, [audioQueue, isPlaying, currentAudio]);

  // Clean up audio player on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Check TTS service availability
  const checkTTSAvailability = async () => {
    try {
      const response = await axios.get(`${API_URL}/voice-profiles`);
      if (response.data.success) {
        setIsAvailable(true);
        setVoiceProfiles(response.data.profiles || []);
      } else {
        setIsAvailable(false);
      }
    } catch (error) {
      console.error('TTS service unavailable:', error);
      setIsAvailable(false);
    }
  };

  // Generate speech from text
  const generateSpeech = async (text, voiceId = 'en_female_1') => {
    if (!isAvailable || !text) return null;
    
    try {
      const response = await axios.post(`${API_URL}/text-to-speech`, {
        text: text,
        voice_id: voiceId
      });
      
      if (response.data.success) {
        // Add to audio queue
        const audioItem = {
          id: `audio-${Date.now()}`,
          url: `http://localhost:3000${response.data.audioUrl}`,
          text: text
        };
        
        setAudioQueue(prev => [...prev, audioItem]);
        return audioItem;
      } else {
        toast({
          title: 'Error generating speech',
          status: 'error',
          duration: 3000,
        });
        return null;
      }
    } catch (error) {
      console.error('Error generating speech:', error);
      toast({
        title: 'Failed to generate speech',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
      return null;
    }
  };

  // Play audio file
  const playAudio = (url) => {
    if (!url) return;
    
    // Create new audio element if needed
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    
    // Setup event listeners
    audioRef.current.onplay = () => setIsPlaying(true);
    audioRef.current.onpause = () => setIsPlaying(false);
    audioRef.current.onended = handleAudioComplete;
    audioRef.current.ontimeupdate = updateProgress;
    
    // Load and play
    audioRef.current.src = url;
    audioRef.current.play().catch(error => {
      console.error('Error playing audio:', error);
      handleAudioComplete(); // Skip to next on error
    });
  };

  // Update progress bar
  const updateProgress = () => {
    if (audioRef.current) {
      const value = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(value);
    }
  };

  // Handle audio completion
  const handleAudioComplete = () => {
    setIsPlaying(false);
    setProgress(0);
    
    // Remove from queue and reset current
    setAudioQueue(prev => prev.filter(item => item !== currentAudio));
    setCurrentAudio(null);
  };

  // Pause audio
  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  // Resume audio
  const resumeAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  // Replay current audio
  const replayAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  // Skip current audio
  const skipAudio = () => {
    handleAudioComplete();
  };

  // Clear audio queue
  const clearQueue = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setAudioQueue([]);
    setCurrentAudio(null);
    setIsPlaying(false);
    setProgress(0);
  };

  // Format time
  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // No UI if service is unavailable
  if (!isAvailable) return null;

  return (
    <Box>
      {currentAudio && (
        <Box 
          borderRadius="md" 
          p={3} 
          bg={colorMode === 'dark' ? 'gray.700' : 'gray.100'}
          mb={2}
        >
          <Text fontSize="sm" mb={2} noOfLines={1}>
            {currentAudio.text.substring(0, 50)}
            {currentAudio.text.length > 50 ? '...' : ''}
          </Text>
          
          <Progress 
            value={progress} 
            size="xs" 
            colorScheme="pink" 
            borderRadius="full"
            mb={2}
          />
          
          <Flex align="center" justify="space-between">
            <Text fontSize="xs">
              {audioRef.current ? formatTime(audioRef.current.currentTime) : '0:00'} / 
              {audioRef.current ? formatTime(audioRef.current.duration) : '0:00'}
            </Text>
            
            <HStack>
              <IconButton
                aria-label="Replay"
                icon={<RepeatIcon />}
                onClick={replayAudio}
                size="sm"
                variant="ghost"
              />
              
              <Button
                size="sm"
                onClick={isPlaying ? pauseAudio : resumeAudio}
                colorScheme={isPlaying ? "red" : "green"}
                variant="outline"
              >
                {isPlaying ? "Pause" : "Play"}
              </Button>
              
              <IconButton
                aria-label="Skip"
                icon={<CheckIcon />}
                onClick={skipAudio}
                size="sm"
                variant="ghost"
              />
              
              <IconButton
                aria-label="Download"
                icon={<DownloadIcon />}
                onClick={() => window.open(currentAudio.url, '_blank')}
                size="sm"
                variant="ghost"
              />
            </HStack>
          </Flex>
        </Box>
      )}
      
      {audioQueue.length > 1 && (
        <Flex justify="space-between" align="center" mb={2}>
          <Text fontSize="sm">{audioQueue.length - 1} more in queue</Text>
          <Button size="xs" colorScheme="red" variant="ghost" onClick={clearQueue}>
            Clear Queue
          </Button>
        </Flex>
      )}
    </Box>
  );
};

export default AudioManager;

// Export a service object for other components to use
export const AudioService = {
  instance: null,
  
  setInstance(instanceRef) {
    this.instance = instanceRef;
  },
  
  generateSpeech(text, voiceId) {
    if (this.instance && this.instance.current) {
      return this.instance.current.generateSpeech(text, voiceId);
    }
    return null;
  },
  
  clearQueue() {
    if (this.instance && this.instance.current) {
      this.instance.current.clearQueue();
    }
  }
};