import React, { useState, useRef, useEffect } from 'react';
import {
  IconButton,
  Box,
  Tooltip,
  HStack,
  Progress,
  Text,
  Flex
} from '@chakra-ui/react';
import {
  PlayIcon,
  RepeatIcon,
  CloseIcon,
  CheckIcon
} from '@chakra-ui/icons';

const VoicePlayer = ({ audioUrl, onComplete, autoPlay = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio(audioUrl);
    
    // Set up event listeners
    audioRef.current.addEventListener('loadedmetadata', () => {
      setDuration(audioRef.current.duration);
    });
    
    audioRef.current.addEventListener('timeupdate', updateProgress);
    
    audioRef.current.addEventListener('ended', () => {
      setIsPlaying(false);
      setProgress(0);
      if (onComplete) onComplete();
    });
    
    // Auto-play if enabled
    if (autoPlay) {
      audioRef.current.play().catch(error => {
        console.error('Auto-play failed:', error);
      });
      setIsPlaying(true);
    }
    
    // Clean up
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('timeupdate', updateProgress);
      }
    };
  }, [audioUrl, autoPlay, onComplete]);

  const updateProgress = () => {
    if (audioRef.current) {
      const value = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(value);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const replay = () => {
    audioRef.current.currentTime = 0;
    audioRef.current.play();
    setIsPlaying(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <Box 
      borderRadius="md" 
      p={2}
      bg="gray.100" 
      _dark={{ bg: 'gray.700' }}
    >
      <Flex align="center" justify="space-between">
        <HStack spacing={2}>
          <Tooltip label={isPlaying ? 'Pozastavit' : 'Přehrát'}>
            <IconButton
              aria-label={isPlaying ? 'Pause' : 'Play'}
              icon={isPlaying ? <CloseIcon /> : <PlayIcon />}
              onClick={togglePlayPause}
              size="sm"
              colorScheme={isPlaying ? 'red' : 'green'}
              variant="outline"
              isRound
            />
          </Tooltip>
          
          <Tooltip label="Přehrát znovu">
            <IconButton
              aria-label="Replay"
              icon={<RepeatIcon />}
              onClick={replay}
              size="sm"
              variant="outline"
              isRound
            />
          </Tooltip>
        </HStack>
        
        <Text fontSize="xs" ml={2} mr={2}>
          {audioRef.current ? formatTime(audioRef.current.currentTime) : '0:00'} / 
          {duration ? formatTime(duration) : '0:00'}
        </Text>
        
        <Tooltip label="Dokončeno">
          <IconButton
            aria-label="Complete"
            icon={<CheckIcon />}
            onClick={onComplete}
            size="sm"
            variant="ghost"
            isRound
          />
        </Tooltip>
      </Flex>
      
      <Progress 
        value={progress} 
        size="xs" 
        colorScheme="pink" 
        mt={2} 
        borderRadius="full"
      />
    </Box>
  );
};

export default VoicePlayer;