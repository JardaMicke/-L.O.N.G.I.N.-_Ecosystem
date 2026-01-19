/**
 * Update Service
 * Handles checking for updates, downloading updates, and managing update process.
 * @module services/update-service
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import logger, { logInfo, logError } from '../utils/logger';

// Dependencies that might be missing in package.json but are used in original code
// Using require to avoid TS errors if types are missing
// eslint-disable-next-line @typescript-eslint/no-var-requires
const AdmZip = require('adm-zip');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const semver = require('semver');

// GitHub API constants
const GITHUB_API_URL = 'https://api.github.com/repos/username/candy-ai-clone';
const GITHUB_RELEASES_URL = `${GITHUB_API_URL}/releases`;
const GITHUB_LATEST_RELEASE_URL = `${GITHUB_RELEASES_URL}/latest`;

// Update constants
// eslint-disable-next-line @typescript-eslint/no-var-requires
const APP_VERSION = require('../../package.json').version;
const UPDATE_DIR = path.join(__dirname, '../../updates');
const DOWNLOAD_DIR = path.join(UPDATE_DIR, 'downloads');
const BACKUP_DIR = path.join(UPDATE_DIR, 'backups');
const CONFIG_FILE = path.join(UPDATE_DIR, 'update-config.json');

interface UpdateConfig {
    lastUpdateCheck: string | null;
    ignoredVersion: string | null;
    autoCheck: boolean;
    autoDownload: boolean;
    checkInterval: number;
    updateChannel: string;
}

interface UpdateInfo {
    version: string;
    currentVersion: string;
    releaseDate: string;
    changelog: string[];
    downloadUrl: string | null;
    size: string;
    releaseNotes: string;
    assets: {
        windows: string | null;
        linux: string | null;
        macos: string | null;
    };
}

interface CheckResult {
    updateAvailable: boolean;
    updateInfo: UpdateInfo | null;
}

interface DownloadStatus {
    id: string;
    url: string;
    path: string;
    startTime: Date;
    progress: number;
    status: 'downloading' | 'completed' | 'error';
    error: string | null;
    completedAt?: Date;
}

export class UpdateService extends EventEmitter {
    private downloads: Map<string, DownloadStatus>;
    private config: UpdateConfig;

    constructor() {
        super();
        this.ensureDirectories();
        this.downloads = new Map(); // Track downloads in progress
        this.config = this.loadConfig();
    }

    /**
     * Ensure all necessary directories exist
     */
    private ensureDirectories (): void {
        const dirs = [UPDATE_DIR, DOWNLOAD_DIR, BACKUP_DIR];
        dirs.forEach(dir => {
            if (!fs.existsSync(dir))
            {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    /**
     * Load update configuration
     */
    private loadConfig (): UpdateConfig {
        try
        {
            if (fs.existsSync(CONFIG_FILE))
            {
                return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            }
        } catch (error)
        {
            logError('Error loading update config', error as Error);
        }

        // Default config
        const defaultConfig: UpdateConfig = {
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
    private saveConfig (config: UpdateConfig): void {
        try
        {
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
            this.config = config;
        } catch (error)
        {
            logError('Error saving update config', error as Error);
        }
    }

    /**
     * Check for updates
     */
    public async checkForUpdates (): Promise<CheckResult> {
        try
        {
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
            const changelog = (latestRelease.body as string)
                .split('\n')
                .filter(line => line.trim().length > 0)
                .map(line => line.replace(/^[#\-*]\s*/, '').trim());

            // Find Windows assets
            const windowsAsset = latestRelease.assets.find((asset: any) =>
                asset.name.endsWith('.exe') ||
                asset.name.endsWith('.zip') ||
                asset.name.includes('windows')
            );

            // Find Linux assets
            const linuxAsset = latestRelease.assets.find((asset: any) =>
                asset.name.endsWith('.AppImage') ||
                asset.name.endsWith('.deb') ||
                asset.name.includes('linux')
            );

            // Find macOS assets
            const macOSAsset = latestRelease.assets.find((asset: any) =>
                asset.name.endsWith('.dmg') ||
                asset.name.includes('macos') ||
                asset.name.includes('darwin')
            );

            // Get appropriate asset for current platform
            let platformAsset;
            if (process.platform === 'win32')
            {
                platformAsset = windowsAsset;
            } else if (process.platform === 'linux')
            {
                platformAsset = linuxAsset;
            } else if (process.platform === 'darwin')
            {
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
        } catch (error)
        {
            logError('Error checking for updates', error as Error);
            throw new Error('Failed to check for updates');
        }
    }

    /**
     * Format file size in human-readable format
     */
    private formatFileSize (bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Start downloading an update
     */
    public async startDownload (url: string): Promise<string> {
        try
        {
            const downloadId = uuidv4();
            const downloadPath = path.join(DOWNLOAD_DIR, `update-${downloadId}.zip`);

            // Create download record
            const downloadStatus: DownloadStatus = {
                id: downloadId,
                url,
                path: downloadPath,
                startTime: new Date(),
                progress: 0,
                status: 'downloading',
                error: null
            };

            this.downloads.set(downloadId, downloadStatus);

            // Start download in background
            this.downloadFile(downloadId, url, downloadPath);

            return downloadId;
        } catch (error)
        {
            logError('Error starting download', error as Error);
            throw new Error('Failed to start download');
        }
    }

    /**
     * Download file and track progress
     */
    private async downloadFile (downloadId: string, url: string, destination: string): Promise<string> {
        try
        {
            const writer = fs.createWriteStream(destination);

            const response = await axios({
                url,
                method: 'GET',
                responseType: 'stream',
                headers: {
                    'User-Agent': 'Candy-AI-Clone'
                }
            });

            const totalLength = parseInt(response.headers['content-length'] || '0', 10);

            let downloadedLength = 0;

            response.data.on('data', (chunk: Buffer) => {
                downloadedLength += chunk.length;
                const progress = totalLength > 0 ? Math.round((downloadedLength / totalLength) * 100) : 0;

                // Update progress
                const download = this.downloads.get(downloadId);
                if (download)
                {
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
                    if (download)
                    {
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

                writer.on('error', (err: Error) => {
                    const download = this.downloads.get(downloadId);
                    if (download)
                    {
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
        } catch (error)
        {
            const download = this.downloads.get(downloadId);
            if (download)
            {
                download.status = 'error';
                download.error = (error as Error).message;
                this.downloads.set(downloadId, download);

                // Emit error event
                this.emit('download-error', {
                    id: downloadId,
                    error: (error as Error).message
                });
            }

            logError('Error downloading update', error as Error);
            throw error;
        }
    }

    /**
     * Get download progress
     */
    public getDownloadProgress (downloadId: string): DownloadStatus {
        const download = this.downloads.get(downloadId);

        if (!download)
        {
            throw new Error('Download not found');
        }

        return { ...download };
    }

    /**
     * Prepare update for installation
     */
    public async prepareUpdate (downloadId: string): Promise<any> {
        try
        {
            const download = this.downloads.get(downloadId);

            if (!download)
            {
                throw new Error('Download not found');
            }

            if (download.status !== 'completed')
            {
                throw new Error('Download not completed');
            }

            const downloadPath = download.path;
            const extractPath = path.join(UPDATE_DIR, `extract-${downloadId}`);

            // Create extraction directory
            if (!fs.existsSync(extractPath))
            {
                fs.mkdirSync(extractPath, { recursive: true });
            }

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
        } catch (error)
        {
            logError('Error preparing update', error as Error);
            throw new Error('Failed to prepare update');
        }
    }

    /**
     * Create backup of current version
     */
    public async createBackup (backupPath: string): Promise<string> {
        try
        {
            const zip = new AdmZip();

            // Add directories to backup
            const dirsToBackup = ['frontend', 'backend', 'config'];

            for (const dir of dirsToBackup)
            {
                const dirPath = path.join(__dirname, '../../', dir);
                if (fs.existsSync(dirPath))
                {
                    zip.addLocalFolder(dirPath, dir);
                }
            }

            // Add specific files to backup
            const filesToBackup = ['package.json'];

            for (const file of filesToBackup)
            {
                const filePath = path.join(__dirname, '../../', file);
                if (fs.existsSync(filePath))
                {
                    zip.addLocalFile(filePath);
                }
            }

            // Write backup file
            zip.writeZip(backupPath);

            return backupPath;
        } catch (error)
        {
            logError('Error creating backup', error as Error);
            throw new Error('Failed to create backup');
        }
    }

    /**
     * Restore from backup
     */
    public async restoreFromBackup (backupPath: string): Promise<boolean> {
        try
        {
            if (!fs.existsSync(backupPath))
            {
                throw new Error('Backup file not found');
            }

            const zip = new AdmZip(backupPath);
            const extractPath = path.join(__dirname, '../../');

            zip.extractAllTo(extractPath, true);

            return true;
        } catch (error)
        {
            logError('Error restoring from backup', error as Error);
            throw new Error('Failed to restore from backup');
        }
    }

    /**
     * Ignore a specific version
     */
    public ignoreVersion (version: string): void {
        this.config.ignoredVersion = version;
        this.saveConfig(this.config);
    }

    /**
     * Update application settings
     */
    public updateSettings (settings: Partial<UpdateConfig>): UpdateConfig {
        this.config = { ...this.config, ...settings };
        this.saveConfig(this.config);
        return this.config;
    }
}

// Create singleton instance
const updateService = new UpdateService();
export default updateService;
