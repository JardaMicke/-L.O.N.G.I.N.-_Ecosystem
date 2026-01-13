/**
 * @fileoverview Main Electron entry point for Longin charakter AI
 * 
 * This file initializes the Electron application, sets up windows,
 * event handlers, and IPC communication.
 * 
 * @module main
 * @version 1.0.0
 * @author Longin AI Team
 * @license MIT
 */

const { app, BrowserWindow, ipcMain, shell, dialog, Menu, Tray } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');
const isDev = process.env.NODE_ENV === 'development';

// Global references to avoid garbage collection
let mainWindow = null;
let tray = null;
let isQuiting = false;

// Configuration and auto-repair
let config = null;
let autoRepair = null;

/**
 * Creates the main application window
 */
function createMainWindow() {
  // Load config from a file if it exists
  loadConfiguration();
  
  // Create auto-repair service
  setupAutoRepair();
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../public/assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false // Don't show the window until it's ready
  });
  
  // Load the app
  if (isDev) {
    // In development, load from React dev server
    mainWindow.loadURL('http://localhost:3000');
    
    // Open DevTools automatically in development
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from built files
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, '../build/index.html'),
        protocol: 'file:',
        slashes: true
      })
    );
  }
  
  // Show window when it's ready to avoid visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Run system check if auto-repair is enabled
    if (autoRepair && config?.autoRepair?.enabled) {
      autoRepair.performSystemCheck()
        .then(result => {
          if (result.remainingIssues.length > 0) {
            dialog.showMessageBox(mainWindow, {
              type: 'warning',
              title: 'Systémové problémy',
              message: `Byly zjištěny problémy se systémem: ${result.remainingIssues.join(', ')}`,
              detail: 'Některé funkce aplikace nemusí fungovat správně. Zkuste spustit průvodce opravou z nabídky Nápověda.',
              buttons: ['OK']
            });
          }
        })
        .catch(error => {
          console.error('System check failed:', error);
        });
    }
  });
  
  // Window event handlers
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  mainWindow.on('close', (event) => {
    if (!isQuiting && config?.ui?.minimizeToTray) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });
  
  // Create application menu
  setupApplicationMenu();
  
  // Setup system tray
  setupSystemTray();
  
  // Setup IPC handlers
  setupIpcHandlers();
}

/**
 * Loads configuration from a file
 */
function loadConfiguration() {
  const configPath = path.join(app.getPath('userData'), 'config.json');
  
  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      config = JSON.parse(configData);
      console.log('Configuration loaded from:', configPath);
    } else {
      // Create default configuration if it doesn't exist
      config = {
        autoRepair: {
          enabled: true,
          maxAttempts: 3,
          retryDelay: 2000
        },
        ui: {
          theme: 'dark',
          minimizeToTray: true,
          enableAnimations: true
        },
        server: {
          port: 3000,
          host: 'localhost',
          useHttps: false
        },
        apis: {
          ollamaUrl: 'http://localhost:11434',
          comfyUiUrl: 'http://localhost:7860',
          ttsUrl: 'http://localhost:5002'
        }
      };
      
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
      console.log('Default configuration created at:', configPath);
    }
  } catch (error) {
    console.error('Failed to load configuration:', error);
    config = {};
  }
}

/**
 * Saves configuration to a file
 */
function saveConfiguration() {
  const configPath = path.join(app.getPath('userData'), 'config.json');
  
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    console.log('Configuration saved to:', configPath);
  } catch (error) {
    console.error('Failed to save configuration:', error);
    
    dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'Chyba při ukládání konfigurace',
      message: 'Nepodařilo se uložit konfiguraci.',
      detail: error.message,
      buttons: ['OK']
    });
  }
}

/**
 * Sets up the auto-repair service
 */
function setupAutoRepair() {
  try {
    // Try to load the auto-repair module
    const { AutoRepairService } = require('../utils/auto-repair');
    
    autoRepair = new AutoRepairService({
      config: config?.autoRepair,
      logRepair: (message, level) => {
        console.log(`[AUTO-REPAIR] [${level}] ${message}`);
      }
    });
    
    console.log('Auto-repair service initialized');
  } catch (error) {
    console.error('Failed to initialize auto-repair service:', error);
    autoRepair = null;
  }
}

/**
 * Sets up the application menu
 */
function setupApplicationMenu() {
  const template = [
    {
      label: 'Soubor',
      submenu: [
        {
          label: 'Nový chat',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-new-chat');
            }
          }
        },
        {
          label: 'Otevřít...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-open-file');
            }
          }
        },
        {
          label: 'Uložit',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-save-file');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Nastavení',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-open-settings');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Ukončit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            isQuiting = true;
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Upravit',
      submenu: [
        { role: 'undo', label: 'Zpět' },
        { role: 'redo', label: 'Znovu' },
        { type: 'separator' },
        { role: 'cut', label: 'Vyjmout' },
        { role: 'copy', label: 'Kopírovat' },
        { role: 'paste', label: 'Vložit' },
        { role: 'delete', label: 'Smazat' },
        { type: 'separator' },
        { role: 'selectAll', label: 'Vybrat vše' }
      ]
    },
    {
      label: 'Zobrazení',
      submenu: [
        { role: 'reload', label: 'Obnovit' },
        { role: 'forceReload', label: 'Vynutit obnovení' },
        { role: 'toggleDevTools', label: 'Vývojářské nástroje' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Původní velikost' },
        { role: 'zoomIn', label: 'Přiblížit' },
        { role: 'zoomOut', label: 'Oddálit' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Celá obrazovka' }
      ]
    },
    {
      label: 'Postavy',
      submenu: [
        {
          label: 'Vytvořit novou postavu',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-create-character');
            }
          }
        },
        {
          label: 'Importovat postavu',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-import-character');
            }
          }
        },
        {
          label: 'Spravovat postavy',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-manage-characters');
            }
          }
        }
      ]
    },
    {
      label: 'Nástroje',
      submenu: [
        {
          label: 'Generování obrázků',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-image-generation');
            }
          }
        },
        {
          label: 'Hlasová syntéza',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-voice-synthesis');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Docker ovládací panel',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-docker-panel');
            }
          }
        },
        {
          label: 'Spustit místní LLM',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-start-llm');
            }
          }
        }
      ]
    },
    {
      label: 'Nápověda',
      submenu: [
        {
          label: 'Dokumentace',
          click: () => {
            shell.openExternal('https://github.com/username/longin-charakter-ai/wiki');
          }
        },
        {
          label: 'Nahlásit problém',
          click: () => {
            shell.openExternal('https://github.com/username/longin-charakter-ai/issues');
          }
        },
        { type: 'separator' },
        {
          label: 'Průvodce opravou',
          click: () => {
            runRepairWizard();
          }
        },
        { type: 'separator' },
        {
          label: 'O aplikaci',
          click: () => {
            showAboutDialog();
          }
        }
      ]
    }
  ];
  
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * Sets up the system tray
 */
function setupSystemTray() {
  if (!config?.ui?.minimizeToTray) {
    return;
  }
  
  // Create tray icon
  tray = new Tray(path.join(__dirname, '../public/assets/tray-icon.png'));
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Otevřít Longin AI',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Nový chat',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.webContents.send('menu-new-chat');
        }
      }
    },
    {
      label: 'Spravovat postavy',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.webContents.send('menu-manage-characters');
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Ukončit',
      click: () => {
        isQuiting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('Longin charakter AI');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    }
  });
}

/**
 * Sets up IPC handlers for communication between renderer and main process
 */
function setupIpcHandlers() {
  // Get app info
  ipcMain.handle('get-app-info', () => {
    return {
      version: app.getVersion(),
      appPath: app.getAppPath(),
      userDataPath: app.getPath('userData'),
      platform: process.platform
    };
  });
  
  // Get configuration
  ipcMain.handle('get-config', () => {
    return config || {};
  });
  
  // Save configuration
  ipcMain.handle('save-config', (event, newConfig) => {
    config = { ...config, ...newConfig };
    saveConfiguration();
    return { success: true };
  });
  
  // Open external link
  ipcMain.handle('open-external-link', (event, url) => {
    shell.openExternal(url);
    return { success: true };
  });
  
  // Run auto-repair
  ipcMain.handle('run-auto-repair', async (event, options) => {
    if (!autoRepair) {
      return {
        success: false,
        error: 'Auto-repair service is not available'
      };
    }
    
    try {
      const result = await autoRepair.performSystemCheck(options);
      return {
        success: true,
        result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  });
  
  // Repair specific problem
  ipcMain.handle('repair-problem', async (event, { problemType, config: problemConfig }) => {
    if (!autoRepair) {
      return {
        success: false,
        error: 'Auto-repair service is not available'
      };
    }
    
    try {
      const result = await autoRepair.repairProblem(problemType, problemConfig || {});
      return {
        success: result,
        problemType
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  });
  
  // Show file open dialog
  ipcMain.handle('show-open-dialog', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
  });
  
  // Show file save dialog
  ipcMain.handle('show-save-dialog', async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, options);
    return result;
  });
  
  // Show message box
  ipcMain.handle('show-message-box', async (event, options) => {
    const result = await dialog.showMessageBox(mainWindow, options);
    return result;
  });
}

/**
 * Shows the about dialog
 */
function showAboutDialog() {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'O aplikaci',
    message: 'Longin charakter AI',
    detail: `Verze: ${app.getVersion()}\nElectron: ${process.versions.electron}\nChrome: ${process.versions.chrome}\nNode.js: ${process.versions.node}\n\n© 2025 Longin AI Team`,
    buttons: ['OK']
  });
}

/**
 * Runs the repair wizard
 */
function runRepairWizard() {
  if (!autoRepair) {
    dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'Průvodce opravou',
      message: 'Průvodce opravou není dostupný.',
      detail: 'Auto-repair služba není inicializována. Zkuste restartovat aplikaci.',
      buttons: ['OK']
    });
    return;
  }
  
  mainWindow.webContents.send('run-repair-wizard');
}

// App event handlers
app.on('ready', createMainWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createMainWindow();
  }
});

app.on('before-quit', () => {
  isQuiting = true;
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  
  // Log to file
  const logPath = path.join(app.getPath('userData'), 'logs', 'errors.log');
  const logDir = path.dirname(logPath);
  
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  fs.appendFileSync(
    logPath,
    `[${new Date().toISOString()}] Uncaught exception: ${error.stack || error}\n`
  );
  
  // Show error dialog if window is available
  if (mainWindow) {
    dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'Neošetřená výjimka',
      message: 'V aplikaci došlo k neošetřené výjimce.',
      detail: `${error.stack || error}\n\nTato chyba byla zaznamenána do souboru: ${logPath}`,
      buttons: ['OK']
    });
  }
});