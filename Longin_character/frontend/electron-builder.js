/**
 * Electron Builder Configuration
 * 
 * Configuration for packaging the Electron application for distribution.
 */

const { notarize } = require('electron-notarize');
const path = require('path');
const fs = require('fs');

// Package version from package.json
const packageJson = require('./package.json');
const appVersion = packageJson.version;

/**
 * Configuration for electron-builder
 */
module.exports = {
  appId: 'com.vibecoding.candyai',
  productName: 'Candy AI',
  copyright: 'Copyright © 2023 Vibe Coding',
  
  // Directories
  directories: {
    output: 'dist',
    buildResources: 'public/assets'
  },
  
  // Files to include
  files: [
    'build/**/*',
    'node_modules/**/*',
    'package.json'
  ],
  
  // Windows specific configuration
  win: {
    icon: 'public/assets/icon.png',
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      }
    ],
    artifactName: '${productName}-Setup-${version}.${ext}'
  },
  
  // NSIS installer configuration
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Candy AI',
    uninstallDisplayName: 'Candy AI',
    installerIcon: 'public/assets/icon.ico',
    uninstallerIcon: 'public/assets/icon.ico',
    installerHeader: 'public/assets/installer-header.png',
    installerSidebar: 'public/assets/installer-sidebar.png',
    uninstallerSidebar: 'public/assets/installer-sidebar.png'
  },
  
  // macOS specific configuration
  mac: {
    icon: 'public/assets/icon.icns',
    category: 'public.app-category.productivity',
    target: {
      target: 'dmg',
      arch: ['x64', 'arm64']
    },
    darkModeSupport: true
  },
  
  // DMG configuration
  dmg: {
    background: 'public/assets/dmg-background.png',
    icon: 'public/assets/icon.icns',
    iconSize: 128,
    window: {
      width: 540,
      height: 380
    },
    contents: [
      {
        x: 130,
        y: 220
      },
      {
        x: 410,
        y: 220,
        type: 'link',
        path: '/Applications'
      }
    ]
  },
  
  // Linux specific configuration
  linux: {
    icon: 'public/assets/icon.png',
    target: ['AppImage', 'deb'],
    category: 'Utility',
    maintainer: 'Vibe Coding',
    vendor: 'Vibe Coding'
  },
  
  // Publish configuration for auto-updates
  publish: {
    provider: 'github',
    owner: 'vibecoding',
    repo: 'candy-ai-clone',
    private: false,
    releaseType: 'release'
  },
  
  // Extra resources to include
  extraResources: [
    {
      from: 'resources',
      to: 'resources',
      filter: ['**/*']
    }
  ],
  
  // After pack hook
  afterPack: async (context) => {
    console.log('After pack hook executed');
    // Add any post-packaging operations here
  },
  
  // After sign hook for notarizing macOS app
  afterSign: async (context) => {
    // Only notarize on macOS
    if (process.platform !== 'darwin') return;
    
    // Only notarize when publishing
    if (process.env.NOTARIZE !== 'true') return;
    
    console.log('Notarizing macOS application...');
    
    const appPath = path.join(
      context.appOutDir,
      `${context.packager.appInfo.productFilename}.app`
    );
    
    try {
      await notarize({
        appBundleId: context.appInfo.info._configuration.appId,
        appPath,
        appleId: process.env.APPLE_ID,
        appleIdPassword: process.env.APPLE_ID_PASSWORD,
        ascProvider: process.env.APPLE_TEAM_ID
      });
      
      console.log('Notarization completed successfully');
    } catch (error) {
      console.error('Notarization failed:', error);
    }
  }
};