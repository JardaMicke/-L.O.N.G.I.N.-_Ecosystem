/**
 * Update Routes
 * 
 * API endpoints for update functionality
 */

const express = require('express');
const router = express.Router();
const updateService = require('../update-service');
const authenticateJWT = require('../middleware/auth');

/**
 * Check for updates
 * GET /api/update/check
 */
router.get('/check', async (req, res) => {
  try {
    const result = await updateService.checkForUpdates();
    res.json(result);
  } catch (error) {
    console.error('Error checking for updates:', error);
    res.status(500).json({ error: 'Failed to check for updates' });
  }
});

/**
 * Start update download
 * POST /api/update/download
 */
router.post('/download', authenticateJWT, async (req, res) => {
  try {
    // Get latest update info first
    const updateInfo = await updateService.checkForUpdates();
    
    if (!updateInfo.updateAvailable) {
      return res.status(400).json({ error: 'No updates available' });
    }
    
    // Get appropriate download URL for current platform
    let downloadUrl;
    
    if (process.platform === 'win32') {
      downloadUrl = updateInfo.updateInfo.assets.windows;
    } else if (process.platform === 'linux') {
      downloadUrl = updateInfo.updateInfo.assets.linux;
    } else if (process.platform === 'darwin') {
      downloadUrl = updateInfo.updateInfo.assets.macos;
    } else {
      downloadUrl = updateInfo.updateInfo.downloadUrl;
    }
    
    if (!downloadUrl) {
      return res.status(400).json({ error: 'No download available for your platform' });
    }
    
    // Start download
    const downloadId = await updateService.startDownload(downloadUrl);
    
    res.json({ 
      downloadId,
      message: 'Download started'
    });
  } catch (error) {
    console.error('Error starting download:', error);
    res.status(500).json({ error: 'Failed to start download' });
  }
});

/**
 * Get download progress
 * GET /api/update/progress/:downloadId
 */
router.get('/progress/:downloadId', authenticateJWT, (req, res) => {
  try {
    const { downloadId } = req.params;
    const progress = updateService.getDownloadProgress(downloadId);
    
    res.json(progress);
  } catch (error) {
    console.error('Error getting download progress:', error);
    res.status(500).json({ error: 'Failed to get download progress' });
  }
});

/**
 * Prepare update for installation
 * POST /api/update/prepare/:downloadId
 */
router.post('/prepare/:downloadId', authenticateJWT, async (req, res) => {
  try {
    const { downloadId } = req.params;
    const updateInfo = await updateService.prepareUpdate(downloadId);
    
    res.json(updateInfo);
  } catch (error) {
    console.error('Error preparing update:', error);
    res.status(500).json({ error: 'Failed to prepare update' });
  }
});

/**
 * Ignore a specific version
 * POST /api/update/ignore/:version
 */
router.post('/ignore/:version', authenticateJWT, (req, res) => {
  try {
    const { version } = req.params;
    updateService.ignoreVersion(version);
    
    res.json({ message: `Version ${version} will be ignored` });
  } catch (error) {
    console.error('Error ignoring version:', error);
    res.status(500).json({ error: 'Failed to ignore version' });
  }
});

/**
 * Update settings
 * PUT /api/update/settings
 */
router.put('/settings', authenticateJWT, (req, res) => {
  try {
    const settings = req.body;
    const updatedSettings = updateService.updateSettings(settings);
    
    res.json(updatedSettings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

/**
 * Get update settings
 * GET /api/update/settings
 */
router.get('/settings', authenticateJWT, (req, res) => {
  try {
    res.json(updateService.config);
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

/**
 * Restore from backup
 * POST /api/update/restore/:backupPath
 */
router.post('/restore', authenticateJWT, async (req, res) => {
  try {
    const { backupPath } = req.body;
    
    if (!backupPath) {
      return res.status(400).json({ error: 'Backup path is required' });
    }
    
    await updateService.restoreFromBackup(backupPath);
    
    res.json({ message: 'Restore completed successfully' });
  } catch (error) {
    console.error('Error restoring from backup:', error);
    res.status(500).json({ error: 'Failed to restore from backup' });
  }
});

module.exports = router;