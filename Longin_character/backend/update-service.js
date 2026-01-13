/**
 * Update Service
 * 
 * Handles checking for updates, downloading updates, and managing update process.
 */

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');
const AdmZip = require('adm-zip');
const semver = require('semver');
const { v4: uuidv4 } = require('uuid');

// GitHub API constants
const GITHUB_API_URL = 'https://api.github.com/repos/username/candy-ai-clone';
const GITHUB_RELEASES_URL = `${GITHUB_API_URL}/releases`;
const GITHUB_LATEST_RELEASE_URL = `${GITHUB_RELEASES_URL}/latest`;

// Update constants
const APP_VERSION = require('../package.json').version;
const UPDATE_DIR = path.join(__dirname, '..', 'updates');
const DOWNLOAD_DIR = path.join(UPDATE_DIR, 'downloads');
const BACKUP_DIR = path.join(UPDATE_DIR, 'backups');
const CONFIG_FILE = path.join(UPDATE_DIR, 'update-config.json');

class UpdateService extends EventEmitter {
  constructor() {
    super();
    this.ensureDirectories();
    this.downloads = new Map(); // Track downloads in progress
    
    // Load configuration
    this.config = this.loadConfig();
  }
  
  /**
   * Ensure all necessary directories exist
   */
  ensureDirectories() {
    fs.ensureDirSync(UPDATE_DIR);
    fs.ensureDirSync(DOWNLOAD_DIR);
    fs.ensureDirSync(BACKUP_DIR);
  }
  
  /**
   * Load update configuration
   */
  loadConfig() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      }
    } catch (error) {
      console.error('Error loading update config:', error);
    }
    
    // Default config
    const defaultConfig = {
      lastUpdateCheck: null,
      ignoredVersion: null,
      autoCheck: true,
      autoDownload: false,
      checkInterval: 3600000, // 1 hour
      updateChannel: 'stable'
    };
    
    this.saveConfig(defaultConfig);
    return defaultConfig;
  }
  
  /**
   * Save update configuration
   */
  saveConfig(config) {
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
      this.config = config;
    } catch (error) {
      console.error('Error saving update config:', error);
    }
  }
  
  /**
   * Check for updates
   * @returns {Promise<Object>} Update information
   */
  async checkForUpdates() {
    try {
      // Update last check time
      this.config.lastUpdateCheck = new Date().toISOString();
      this.saveConfig(this.config);
      
      // Fetch latest release from GitHub
      const response = await axios.get(GITHUB_LATEST_RELEASE_URL, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Candy-AI-Clone'
        }
      });
      
      const latestRelease = response.data;
      const latestVersion = latestRelease.tag_name.replace('v', '');
      
      // Compare versions
      const updateAvailable = semver.gt(latestVersion, APP_VERSION) && 
                              latestVersion !== this.config.ignoredVersion;
      
      // Format changelog
      const changelog = latestRelease.body
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^[#\-*]\s*/, '').trim());
      
      // Find Windows assets
      const windowsAsset = latestRelease.assets.find(asset => 
        asset.name.endsWith('.exe') || 
        asset.name.endsWith('.zip') || 
        asset.name.includes('windows')
      );
      
      // Find Linux assets
      const linuxAsset = latestRelease.assets.find(asset => 
        asset.name.endsWith('.AppImage') || 
        asset.name.endsWith('.deb') || 
        asset.name.includes('linux')
      );
      
      // Find macOS assets
      const macOSAsset = latestRelease.assets.find(asset => 
        asset.name.endsWith('.dmg') || 
        asset.name.includes('macos') || 
        asset.name.includes('darwin')
      );
      
      // Get appropriate asset for current platform
      let platformAsset;
      if (process.platform === 'win32') {
        platformAsset = windowsAsset;
      } else if (process.platform === 'linux') {
        platformAsset = linuxAsset;
      } else if (process.platform === 'darwin') {
        platformAsset = macOSAsset;
      }
      
      return {
        updateAvailable,
        updateInfo: updateAvailable ? {
          version: latestVersion,
          currentVersion: APP_VERSION,
          releaseDate: new Date(latestRelease.published_at).toISOString(),
          changelog,
          downloadUrl: platformAsset ? platformAsset.browser_download_url : null,
          size: platformAsset ? this.formatFileSize(platformAsset.size) : 'Unknown',
          releaseNotes: latestRelease.body,
          assets: {
            windows: windowsAsset ? windowsAsset.browser_download_url : null,
            linux: linuxAsset ? linuxAsset.browser_download_url : null,
            macos: macOSAsset ? macOSAsset.browser_download_url : null
          }
        } : null
      };
    } catch (error) {
      console.error('Error checking for updates:', error);
      throw new Error('Failed to check for updates');
    }
  }
  
  /**
   * Format file size in human-readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * Start downloading an update
   * @param {string} url - Download URL
   * @returns {string} Download ID
   */
  async startDownload(url) {
    try {
      const downloadId = uuidv4();
      const downloadPath = path.join(DOWNLOAD_DIR, `update-${downloadId}.zip`);
      
      // Create download record
      this.downloads.set(downloadId, {
        id: downloadId,
        url,
        path: downloadPath,
        startTime: new Date(),
        progress: 0,
        status: 'downloading',
        error: null
      });
      
      // Start download in background
      this.downloadFile(downloadId, url, downloadPath);
      
      return downloadId;
    } catch (error) {
      console.error('Error starting download:', error);
      throw new Error('Failed to start download');
    }
  }
  
  /**
   * Download file and track progress
   * @param {string} downloadId - Download ID
   * @param {string} url - Download URL
   * @param {string} destination - Destination file path
   */
  async downloadFile(downloadId, url, destination) {
    try {
      const writer = fs.createWriteStream(destination);
      
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
        headers: {
          'User-Agent': 'Candy-AI-Clone'
        }
      });
      
      const totalLength = response.headers['content-length'];
      
      let downloadedLength = 0;
      
      response.data.on('data', (chunk) => {
        downloadedLength += chunk.length;
        const progress = Math.round((downloadedLength / totalLength) * 100);
        
        // Update progress
        const download = this.downloads.get(downloadId);
        if (download) {
          download.progress = progress;
          this.downloads.set(downloadId, download);
          
          // Emit progress event
          this.emit('download-progress', {
            id: downloadId,
            progress,
            downloaded: downloadedLength,
            total: totalLength
          });
        }
      });
      
      response.data.pipe(writer);
      
      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          const download = this.downloads.get(downloadId);
          if (download) {
            download.status = 'completed';
            download.progress = 100;
            download.completedAt = new Date();
            this.downloads.set(downloadId, download);
            
            // Emit completion event
            this.emit('download-completed', {
              id: downloadId,
              path: destination
            });
          }
          
          resolve(destination);
        });
        
        writer.on('error', (err) => {
          const download = this.downloads.get(downloadId);
          if (download) {
            download.status = 'error';
            download.error = err.message;
            this.downloads.set(downloadId, download);
            
            // Emit error event
            this.emit('download-error', {
              id: downloadId,
              error: err.message
            });
          }
          
          reject(err);
        });
      });
    } catch (error) {
      const download = this.downloads.get(downloadId);
      if (download) {
        download.status = 'error';
        download.error = error.message;
        this.downloads.set(downloadId, download);
        
        // Emit error event
        this.emit('download-error', {
          id: downloadId,
          error: error.message
        });
      }
      
      console.error('Error downloading update:', error);
      throw error;
    }
  }
  
  /**
   * Get download progress
   * @param {string} downloadId - Download ID
   * @returns {Object} Download progress info
   */
  getDownloadProgress(downloadId) {
    const download = this.downloads.get(downloadId);
    
    if (!download) {
      throw new Error('Download not found');
    }
    
    return {
      id: download.id,
      progress: download.progress,
      status: download.status,
      error: download.error,
      startTime: download.startTime,
      completedAt: download.completedAt
    };
  }
  
  /**
   * Prepare update for installation
   * @param {string} downloadId - Download ID
   * @returns {Object} Update info
   */
  async prepareUpdate(downloadId) {
    try {
      const download = this.downloads.get(downloadId);
      
      if (!download) {
        throw new Error('Download not found');
      }
      
      if (download.status !== 'completed') {
        throw new Error('Download not completed');
      }
      
      const downloadPath = download.path;
      const extractPath = path.join(UPDATE_DIR, `extract-${downloadId}`);
      
      // Create extraction directory
      fs.ensureDirSync(extractPath);
      
      // Extract update ZIP
      const zip = new AdmZip(downloadPath);
      zip.extractAllTo(extractPath, true);
      
      // Create backup of current version
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(BACKUP_DIR, `backup-${APP_VERSION}-${timestamp}.zip`);
      
      await this.createBackup(backupPath);
      
      return {
        downloadId,
        extractPath,
        backupPath
      };
    } catch (error) {
      console.error('Error preparing update:', error);
      throw new Error('Failed to prepare update');
    }
  }
  
  /**
   * Create backup of current version
   * @param {string} backupPath - Backup file path
   */
  async createBackup(backupPath) {
    try {
      const zip = new AdmZip();
      
      // Add directories to backup
      const dirsToBackup = ['frontend', 'backend', 'config'];
      
      for (const dir of dirsToBackup) {
        const dirPath = path.join(__dirname, '..', dir);
        if (fs.existsSync(dirPath)) {
          zip.addLocalFolder(dirPath, dir);
        }
      }
      
      // Add specific files to backup
      const filesToBackup = ['package.json'];
      
      for (const file of filesToBackup) {
        const filePath = path.join(__dirname, '..', file);
        if (fs.existsSync(filePath)) {
          zip.addLocalFile(filePath);
        }
      }
      
      // Write backup file
      zip.writeZip(backupPath);
      
      return backupPath;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error('Failed to create backup');
    }
  }
  
  /**
   * Restore from backup
   * @param {string} backupPath - Backup file path
   */
  async restoreFromBackup(backupPath) {
    try {
      if (!fs.existsSync(backupPath)) {
        throw new Error('Backup file not found');
      }
      
      const zip = new AdmZip(backupPath);
      const extractPath = path.join(__dirname, '..');
      
      zip.extractAllTo(extractPath, true);
      
      return true;
    } catch (error) {
      console.error('Error restoring from backup:', error);
      throw new Error('Failed to restore from backup');
    }
  }
  
  /**
   * Ignore a specific version
   * @param {string} version - Version to ignore
   */
  ignoreVersion(version) {
    this.config.ignoredVersion = version;
    this.saveConfig(this.config);
  }
  
  /**
   * Update application settings
   * @param {Object} settings - New settings
   */
  updateSettings(settings) {
    this.config = { ...this.config, ...settings };
    this.saveConfig(this.config);
    return this.config;
  }
}

// Create singleton instance
const updateService = new UpdateService();
module.exports = updateService;