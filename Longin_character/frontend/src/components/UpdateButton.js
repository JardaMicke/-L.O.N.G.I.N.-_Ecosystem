import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Badge, 
  Tooltip, 
  useToast,
  Spinner,
  Text
} from '@chakra-ui/react';
import { FaDownload, FaCheckCircle, FaExclamationCircle, FaArrowCircleUp } from 'react-icons/fa';
import ApiClient from '../utils/ApiClient';
import { useUpdateContext } from '../contexts/UpdateContext';

/**
 * Update Button Component
 * 
 * A button component that checks for updates and allows the user to
 * download and install them with a single click.
 */
const UpdateButton = ({ variant = "solid", size = "md", ...props }) => {
  const [isChecking, setIsChecking] = useState(false);
  const { 
    updateAvailable, 
    updateInfo, 
    checkForUpdates,
    downloadUpdate,
    isDownloading,
    downloadProgress,
    error,
    showUpdateModal
  } = useUpdateContext();
  const toast = useToast();
  
  // Check for updates when component mounts
  useEffect(() => {
    handleCheckForUpdates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Handle check for updates
  const handleCheckForUpdates = async () => {
    try {
      setIsChecking(true);
      await checkForUpdates();
      setIsChecking(false);
    } catch (err) {
      setIsChecking(false);
      toast({
        title: "Update Check Failed",
        description: "Could not check for updates. Please try again later.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle update button click
  const handleUpdateClick = () => {
    if (updateAvailable) {
      if (isDownloading) {
        // If already downloading, show the modal with progress
        showUpdateModal();
      } else {
        // Start download and show modal
        downloadUpdate();
        showUpdateModal();
      }
    } else {
      // Check for updates if not already checking
      if (!isChecking) {
        handleCheckForUpdates();
      }
    }
  };
  
  // Button states
  let icon = <FaArrowCircleUp />;
  let label = "Check for Updates";
  let colorScheme = "gray";
  let disabled = false;
  let tooltipText = "Check if a new version is available";
  
  if (isChecking) {
    icon = <Spinner size="sm" />;
    label = "Checking...";
    disabled = true;
    tooltipText = "Checking for updates...";
  } else if (updateAvailable) {
    icon = <FaDownload />;
    label = "Update Available";
    colorScheme = "green";
    tooltipText = `Version ${updateInfo?.version} is available. Click to update.`;
  } else if (error) {
    icon = <FaExclamationCircle />;
    label = "Update Failed";
    colorScheme = "red";
    tooltipText = `Error: ${error}. Click to try again.`;
  } else if (isDownloading) {
    icon = <Spinner size="sm" />;
    label = `Downloading: ${downloadProgress}%`;
    colorScheme = "blue";
    disabled = true;
    tooltipText = "Downloading update...";
  }

  return (
    <Tooltip label={tooltipText} hasArrow>
      <Button
        leftIcon={icon}
        colorScheme={colorScheme}
        onClick={handleUpdateClick}
        isDisabled={disabled}
        variant={variant}
        size={size}
        {...props}
      >
        {label}
        {updateAvailable && (
          <Badge ml={2} colorScheme="green" borderRadius="full" px={2}>
            {updateInfo?.version}
          </Badge>
        )}
      </Button>
    </Tooltip>
  );
};

export default UpdateButton;