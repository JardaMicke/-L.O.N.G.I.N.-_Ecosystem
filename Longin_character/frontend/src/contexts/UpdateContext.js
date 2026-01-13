import React, { createContext, useState, useContext, useEffect } from 'react';
import ApiClient from '../utils/ApiClient';

// Create context
const UpdateContext = createContext();

/**
 * Update Provider Component
 * 
 * Provides state and functions for the update system
 */
export const UpdateProvider = ({ children }) => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadId, setDownloadId] = useState(null);
  const [error, setError] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const apiClient = new ApiClient();

  // Check for updates
  const checkForUpdates = async () => {
    try {
      setError(null);
      const response = await apiClient.get('/api/update/check');
      
      if (response.updateAvailable) {
        setUpdateAvailable(true);
        setUpdateInfo(response.updateInfo);
      } else {
        setUpdateAvailable(false);
        setUpdateInfo(null);
      }
      
      return response;
    } catch (err) {
      console.error('Error checking for updates:', err);
      setError('Failed to check for updates');
      throw err;
    }
  };

  // Download update
  const downloadUpdate = async () => {
    try {
      setError(null);
      setIsDownloading(true);
      setDownloadProgress(0);
      
      // Start the download
      const response = await apiClient.post('/api/update/download');
      setDownloadId(response.downloadId);
      
      // Start polling for progress
      startProgressPolling(response.downloadId);
      
      return response.downloadId;
    } catch (err) {
      console.error('Error downloading update:', err);
      setIsDownloading(false);
      setError('Failed to download update');
      throw err;
    }
  };

  // Poll for download progress
  const startProgressPolling = (id) => {
    const progressInterval = setInterval(async () => {
      try {
        const progressResponse = await apiClient.get(`/api/update/progress/${id}`);
        setDownloadProgress(progressResponse.progress);
        
        if (progressResponse.status === 'completed') {
          clearInterval(progressInterval);
          setIsDownloading(false);
          promptInstall(id);
        } else if (progressResponse.status === 'error') {
          clearInterval(progressInterval);
          setIsDownloading(false);
          setError(progressResponse.error || 'Download failed');
        }
      } catch (err) {
        console.error('Error polling progress:', err);
        clearInterval(progressInterval);
        setIsDownloading(false);
        setError('Failed to get download progress');
      }
    }, 1000);
  };

  // Prompt to install update
  const promptInstall = async (id) => {
    try {
      // Prepare the update
      await apiClient.post(`/api/update/prepare/${id}`);
      
      // In Electron, we can use ipcRenderer to communicate with the main process
      if (window.electron) {
        window.electron.send('install-update');
      } else {
        setError('Update downloaded but automatic installation is not available in this environment');
      }
    } catch (err) {
      console.error('Error preparing update:', err);
      setError('Failed to prepare update for installation');
    }
  };

  // Ignore a version
  const ignoreVersion = async (version) => {
    try {
      await apiClient.post(`/api/update/ignore/${version}`);
      setUpdateAvailable(false);
      setUpdateInfo(null);
    } catch (err) {
      console.error('Error ignoring version:', err);
      setError('Failed to ignore version');
    }
  };

  // Update settings
  const updateSettings = async (settings) => {
    try {
      const response = await apiClient.put('/api/update/settings', settings);
      return response;
    } catch (err) {
      console.error('Error updating settings:', err);
      setError('Failed to update settings');
      throw err;
    }
  };

  // Get update settings
  const getUpdateSettings = async () => {
    try {
      const response = await apiClient.get('/api/update/settings');
      return response;
    } catch (err) {
      console.error('Error getting update settings:', err);
      setError('Failed to get update settings');
      throw err;
    }
  };

  // Show update modal
  const showUpdateModal = () => {
    setIsUpdateModalOpen(true);
  };

  // Hide update modal
  const hideUpdateModal = () => {
    setIsUpdateModalOpen(false);
  };

  // Context value
  const value = {
    updateAvailable,
    updateInfo,
    isDownloading,
    downloadProgress,
    downloadId,
    error,
    isUpdateModalOpen,
    checkForUpdates,
    downloadUpdate,
    ignoreVersion,
    updateSettings,
    getUpdateSettings,
    showUpdateModal,
    hideUpdateModal
  };

  return (
    <UpdateContext.Provider value={value}>
      {children}
    </UpdateContext.Provider>
  );
};

// Custom hook to use the update context
export const useUpdateContext = () => {
  const context = useContext(UpdateContext);
  if (!context) {
    throw new Error('useUpdateContext must be used within an UpdateProvider');
  }
  return context;
};