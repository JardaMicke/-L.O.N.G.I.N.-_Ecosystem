/**
 * @fileoverview Preload script for Electron
 * 
 * This script runs in a privileged context that has access to both the Electron
 * APIs and the DOM. It creates a secure bridge between the renderer process
 * and the main process.
 * 
 * @module preload
 * @version 1.0.0
 * @author Longin AI Team
 * @license MIT
 */

const { contextBridge, ipcRenderer } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Expose protected API to renderer process
contextBridge.exposeInMainWorld('electron', {
  // App info
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  
  // Configuration
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  
  // Dialogs
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  
  // External links
  openExternalLink: (url) => ipcRenderer.invoke('open-external-link', url),
  
  // Auto-repair
  runAutoRepair: (options) => ipcRenderer.invoke('run-auto-repair', options),
  repairProblem: (problemType, config) => ipcRenderer.invoke('repair-problem', { problemType, config }),
  
  // IPC events
  on: (channel, callback) => {
    // Whitelist of valid channels
    const validChannels = [
      'menu-new-chat',
      'menu-open-file',
      'menu-save-file',
      'menu-open-settings',
      'menu-create-character',
      'menu-import-character',
      'menu-manage-characters',
      'menu-image-generation',
      'menu-voice-synthesis',
      'menu-docker-panel',
      'menu-start-llm',
      'run-repair-wizard'
    ];
    
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },
  
  // File system utilities (limited for security)
  fs: {
    // Read a file
    readFile: (filePath, options = {}) => {
      return new Promise((resolve, reject) => {
        fs.readFile(filePath, options, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data.toString());
          }
        });
      });
    },
    
    // Write a file
    writeFile: (filePath, data, options = {}) => {
      return new Promise((resolve, reject) => {
        fs.writeFile(filePath, data, options, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(true);
          }
        });
      });
    },
    
    // Check if a file exists
    exists: (filePath) => {
      return new Promise((resolve) => {
        fs.access(filePath, fs.constants.F_OK, (err) => {
          resolve(!err);
        });
      });
    }
  },
  
  // Process utilities
  process: {
    // Run a command and get output
    exec: (command, args = [], options = {}) => {
      return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
          ...options,
          shell: true
        });
        
        let stdout = '';
        let stderr = '';
        
        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });
        
        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });
        
        child.on('close', (code) => {
          resolve({
            code,
            stdout,
            stderr
          });
        });
        
        child.on('error', (err) => {
          reject(err);
        });
      });
    },
    
    // Get environment variables
    env: process.env,
    
    // Get platform
    platform: process.platform
  },
  
  // Path utilities
  path: {
    // Join path segments
    join: (...args) => path.join(...args),
    
    // Get directory name
    dirname: (filePath) => path.dirname(filePath),
    
    // Get base name
    basename: (filePath, ext) => path.basename(filePath, ext),
    
    // Get extension
    extname: (filePath) => path.extname(filePath),
    
    // Get path segments
    parse: (filePath) => path.parse(filePath)
  },
  
  // OS utilities
  os: {
    // Get platform
    platform: () => os.platform(),
    
    // Get CPU architecture
    arch: () => os.arch(),
    
    // Get hostname
    hostname: () => os.hostname(),
    
    // Get homedir
    homedir: () => os.homedir(),
    
    // Get temp directory
    tmpdir: () => os.tmpdir(),
    
    // Get system memory info
    memoryInfo: () => ({
      total: os.totalmem(),
      free: os.freemem()
    }),
    
    // Get CPU info
    cpuInfo: () => ({
      cores: os.cpus().length,
      model: os.cpus()[0].model
    })
  }
});

// Listen for unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection in preload:', error);
});