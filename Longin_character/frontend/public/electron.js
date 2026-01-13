const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { autoUpdater } = require('electron-updater');
const fs = require('fs');
const { spawn } = require('child_process');

// Keep a global reference of the window object
let mainWindow;
let backendProcess;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    show: false,
    frame: true,
    backgroundColor: '#1A202C'
  });

  // Load the app
  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;

  mainWindow.loadURL(startUrl);

  // Show window once ready to prevent white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Check for updates
    if (!isDev) {
      autoUpdater.checkForUpdatesAndNotify();
    }
  });

  // Open DevTools in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Start backend server process
function startBackendServer() {
  const backendPath = isDev
    ? path.join(__dirname, '../../../backend/server.js')
    : path.join(process.resourcesPath, 'backend/server.js');

  if (fs.existsSync(backendPath)) {
    backendProcess = spawn('node', [backendPath], {
      stdio: 'pipe'
    });

    backendProcess.stdout.on('data', (data) => {
      console.log(`Backend stdout: ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`Backend stderr: ${data}`);
    });

    backendProcess.on('close', (code) => {
      console.log(`Backend process exited with code ${code}`);
    });
  } else {
    console.error(`Backend server not found at ${backendPath}`);
    dialog.showErrorBox(
      'Backend Error', 
      'Could not start the backend server. Please reinstall the application.'
    );
  }
}

// Initialize the app
app.whenReady().then(() => {
  createWindow();
  startBackendServer();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Exit cleanly
app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});

// Auto updater events
autoUpdater.on('update-available', (info) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-available', info);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded', info);
  }
});

autoUpdater.on('download-progress', (progressInfo) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-progress', progressInfo);
  }
});

autoUpdater.on('error', (err) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-error', err);
  }
});

// IPC handlers
ipcMain.on('install-update', () => {
  autoUpdater.quitAndInstall();
});

ipcMain.on('check-for-updates', () => {
  if (!isDev) {
    autoUpdater.checkForUpdates();
  }
});

// Export API settings
ipcMain.handle('export-character', async (event, characterData) => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Export Character',
    defaultPath: `${characterData.name}.json`,
    filters: [{ name: 'JSON Files', extensions: ['json'] }]
  });

  if (filePath) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(characterData, null, 2));
      return { success: true, path: filePath };
    } catch (error) {
      console.error('Error exporting character:', error);
      return { success: false, error: error.message };
    }
  }

  return { success: false, error: 'Export cancelled' };
});

// Import character
ipcMain.handle('import-character', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    title: 'Import Character',
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
    properties: ['openFile']
  });

  if (filePaths && filePaths.length > 0) {
    try {
      const data = fs.readFileSync(filePaths[0], 'utf8');
      return { success: true, data: JSON.parse(data) };
    } catch (error) {
      console.error('Error importing character:', error);
      return { success: false, error: error.message };
    }
  }

  return { success: false, error: 'Import cancelled' };
});