const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  send: (channel, data) => {
    // whitelist channels
    const validChannels = [
      'install-update',
      'check-for-updates'
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    const validChannels = [
      'update-available',
      'update-downloaded',
      'update-progress',
      'update-error'
    ];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender` 
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  removeAllListeners: (channel) => {
    const validChannels = [
      'update-available',
      'update-downloaded',
      'update-progress',
      'update-error'
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
    }
  },
  invoke: (channel, ...args) => {
    const validChannels = [
      'export-character',
      'import-character'
    ];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
  }
});