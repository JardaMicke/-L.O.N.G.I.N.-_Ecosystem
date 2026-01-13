/**
 * @fileoverview Auto-repair service for the Candy AI installer
 * 
 * This module provides autonomous repair mechanisms for the installer,
 * including problem detection, resolution strategies, and recovery from
 * common failure scenarios. It works with the error-handler.js to provide
 * comprehensive error handling and recovery capabilities.
 * 
 * @module auto-repair
 * @version 1.0.0
 * @author Candy AI Team
 * @license MIT
 */

const { RECOVERY_STRATEGIES, ERROR_TYPES, withRetry } = require('./error-handler');
const logger = require('./logger').getLogger('auto-repair');
const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

/**
 * Maps problem types to descriptive messages
 * @enum {string}
 */
const PROBLEM_DESCRIPTIONS = {
  'node_missing': 'Node.js není nainstalován nebo nelze najít',
  'npm_missing': 'NPM není nainstalován nebo nelze najít',
  'git_missing': 'Git není nainstalován nebo nelze najít',
  'git_clone_failed': 'Klonování Git repozitáře selhalo',
  'docker_missing': 'Docker není nainstalován nebo nelze najít',
  'files_corrupted': 'Některé soubory jsou poškozeny nebo chybí',
  'permission_denied': 'Nemáte dostatečná oprávnění',
  'disk_space_low': 'Nedostatek místa na disku',
  'network_error': 'Chyba síťového připojení',
  'download_failed': 'Stahování souborů selhalo',
  'extraction_failed': 'Rozbalení archivu selhalo',
  'dependency_missing': 'Chybí závislost aplikace',
  'config_invalid': 'Neplatná konfigurace',
  'port_in_use': 'Port je již používán jiným procesem'
};

/**
 * @class AutoRepairService
 * @description Service for autonomous detection and repair of installation issues
 */
class AutoRepairService {
  /**
   * Creates a new AutoRepairService instance
   * @param {Object} [options={}] - Service options
   * @param {Object} [options.config={}] - Configuration options
   * @param {Object} [options.logger=console] - Logger instance
   * @param {Function} [options.executeCommand] - Function to execute commands
   */
  constructor(options = {}) {
    this.config = options.config || {};
    this.logger = options.logger || logger || console;
    this.executeCommand = options.executeCommand || this._executeCommand.bind(this);
    
    // Initialize repair attempts tracking
    this.repairAttempts = {};
    this.maxRepairAttempts = this.config.maxAttempts || 3;
    
    // Initialize dependencies
    this.dependencies = {
      node: { minVersion: this.config.nodeMinVersion || '16.0.0', required: true },
      npm: { minVersion: this.config.npmMinVersion || '7.0.0', required: true },
      git: { minVersion: this.config.gitMinVersion || '2.0.0', required: false },
      docker: { minVersion: this.config.dockerMinVersion || '20.0.0', required: false }
    };
    
    // Initialize problem registry
    this.problemRegistry = new Map();
    
    // Initialize solution strategies
    this.initSolutions();
  }

  /**
   * Initializes solution strategies for various problems
   * @private
   */
  initSolutions() {
    this.solutions = new Map();
    
    // Node.js missing
    this.solutions.set('node_missing', async (config) => {
      this.logger.info('Pokouším se nainstalovat nebo opravit Node.js...');
      
      const platform = process.platform;
      let success = false;
      
      try {
        if (platform === 'win32') {
          // Windows solution
          const nodeUrl = config.downloadUrls?.nodejs?.win32 || 
                         'https://nodejs.org/dist/v16.15.0/node-v16.15.0-x64.msi';
          
          const tempDir = config.tempPath?.win32 || '%TEMP%\\candy-ai-temp';
          const expandedTempDir = tempDir.replace(/%([^%]+)%/g, (_, n) => process.env[n]);
          
          // Ensure temp directory exists
          if (!fs.existsSync(expandedTempDir)) {
            fs.mkdirSync(expandedTempDir, { recursive: true });
          }
          
          const installerPath = path.join(expandedTempDir, 'node_installer.msi');
          
          // Download Node.js installer
          this.logger.info(`Stahuji Node.js z ${nodeUrl}...`);
          
          // Using PowerShell to download
          await this.executeCommand(
            `powershell -Command "& {Invoke-WebRequest -Uri '${nodeUrl}' -OutFile '${installerPath}'}"`, 
            { timeout: 120000 }
          );
          
          // Install Node.js silently
          this.logger.info('Instaluji Node.js...');
          await this.executeCommand(`msiexec /i "${installerPath}" /quiet /norestart`, { timeout: 180000 });
          
          // Verify installation
          try {
            const nodeVersion = execSync('node -v').toString().trim();
            this.logger.info(`Node.js byl úspěšně nainstalován: ${nodeVersion}`);
            success = true;
          } catch (verifyError) {
            this.logger.error(`Nelze ověřit instalaci Node.js: ${verifyError.message}`);
            
            // Try refreshing PATH and checking again
            this.logger.info('Pokouším se aktualizovat PATH a ověřit znovu...');
            
            try {
              // Refresh PATH from registry and check again
              const pathCmd = 'powershell -Command "& {$env:Path = [System.Environment]::GetEnvironmentVariable(\'Path\',\'Machine\') + \';\' + [System.Environment]::GetEnvironmentVariable(\'Path\',\'User\'); node -v}"';
              const refreshResult = execSync(pathCmd).toString().trim();
              
              if (refreshResult.match(/v\d+\.\d+\.\d+/)) {
                this.logger.info(`Node.js byl nalezen po aktualizaci PATH: ${refreshResult}`);
                success = true;
              }
            } catch (refreshError) {
              this.logger.error(`Nelze najít Node.js ani po aktualizaci PATH: ${refreshError.message}`);
            }
          }
        } else if (platform === 'linux') {
          // Linux solution
          this.logger.info('Pokouším se nainstalovat Node.js pomocí package manageru...');
          
          try {
            // Try using apt (Debian/Ubuntu)
            await this.executeCommand('apt-get update && apt-get install -y nodejs npm', { timeout: 180000 });
          } catch (aptError) {
            try {
              // Try using yum (RHEL/CentOS/Fedora)
              await this.executeCommand('yum install -y nodejs npm', { timeout: 180000 });
            } catch (yumError) {
              // Try using NVM as a last resort
              this.logger.info('Pokouším se nainstalovat Node.js pomocí NVM...');
              await this.executeCommand('curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash', { timeout: 60000 });
              await this.executeCommand('export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh" && nvm install 16', { timeout: 180000 });
            }
          }
          
          // Verify installation
          try {
            const nodeVersion = execSync('node -v').toString().trim();
            this.logger.info(`Node.js byl úspěšně nainstalován: ${nodeVersion}`);
            success = true;
          } catch (verifyError) {
            this.logger.error(`Nelze ověřit instalaci Node.js: ${verifyError.message}`);
          }
        } else if (platform === 'darwin') {
          // macOS solution
          this.logger.info('Pokouším se nainstalovat Node.js pomocí brew...');
          
          try {
            // Try using homebrew
            await this.executeCommand('brew install node', { timeout: 180000 });
          } catch (brewError) {
            // Try downloading the pkg installer
            const nodeUrl = config.downloadUrls?.nodejs?.darwin || 
                           'https://nodejs.org/dist/v16.15.0/node-v16.15.0.pkg';
            
            const tempDir = config.tempPath?.darwin || '/tmp/candy-ai-temp';
            
            // Ensure temp directory exists
            if (!fs.existsSync(tempDir)) {
              fs.mkdirSync(tempDir, { recursive: true });
            }
            
            const installerPath = path.join(tempDir, 'node_installer.pkg');
            
            // Download Node.js installer
            this.logger.info(`Stahuji Node.js z ${nodeUrl}...`);
            await this.executeCommand(`curl -L "${nodeUrl}" -o "${installerPath}"`, { timeout: 120000 });
            
            // Install Node.js
            this.logger.info('Instaluji Node.js...');
            await this.executeCommand(`sudo installer -pkg "${installerPath}" -target /`, { timeout: 180000 });
          }
          
          // Verify installation
          try {
            const nodeVersion = execSync('node -v').toString().trim();
            this.logger.info(`Node.js byl úspěšně nainstalován: ${nodeVersion}`);
            success = true;
          } catch (verifyError) {
            this.logger.error(`Nelze ověřit instalaci Node.js: ${verifyError.message}`);
          }
        }
      } catch (error) {
        this.logger.error(`Selhala instalace Node.js: ${error.message}`);
        success = false;
      }
      
      return success;
    });
    
    // NPM missing
    this.solutions.set('npm_missing', async (config) => {
      this.logger.info('Pokouším se nainstalovat nebo opravit NPM...');
      
      let success = false;
      
      try {
        // First check if Node.js is installed
        try {
          execSync('node -v').toString().trim();
        } catch (nodeError) {
          this.logger.error('Node.js není nainstalován, nelze nainstalovat NPM samostatně');
          this.registerProblem('node_missing');
          return false;
        }
        
        // Attempt to install npm
        const platform = process.platform;
        
        if (platform === 'win32') {
          // For Windows, try to install npm globally
          await this.executeCommand('npm install -g npm@latest', { timeout: 120000 });
        } else {
          // For Linux/Mac try multiple approaches
          try {
            await this.executeCommand('npm install -g npm@latest', { timeout: 120000 });
          } catch (npmError) {
            if (platform === 'linux') {
              try {
                // Try apt for Debian/Ubuntu
                await this.executeCommand('apt-get update && apt-get install -y npm', { timeout: 120000 });
              } catch (aptError) {
                // Try yum for RHEL/CentOS/Fedora
                await this.executeCommand('yum install -y npm', { timeout: 120000 });
              }
            } else if (platform === 'darwin') {
              // Try brew for macOS
              await this.executeCommand('brew install npm', { timeout: 120000 });
            }
          }
        }
        
        // Verify installation
        try {
          const npmVersion = execSync('npm -v').toString().trim();
          this.logger.info(`NPM byl úspěšně nainstalován/opraven: ${npmVersion}`);
          success = true;
        } catch (verifyError) {
          this.logger.error(`Nelze ověřit instalaci NPM: ${verifyError.message}`);
        }
      } catch (error) {
        this.logger.error(`Selhala instalace NPM: ${error.message}`);
      }
      
      return success;
    });
    
    // Git clone failed
    this.solutions.set('git_clone_failed', async (config, details) => {
      this.logger.info('Pokouším se opravit selhané klonování Git repozitáře...');
      
      let success = false;
      const { repository, targetDir } = details || {};
      
      if (!repository) {
        this.logger.error('Nelze opravit klonování, chybí URL repozitáře');
        return false;
      }
      
      try {
        // First, check if Git is installed
        try {
          execSync('git --version').toString().trim();
        } catch (gitError) {
          this.logger.error('Git není nainstalován, nelze klonovat repozitář');
          this.registerProblem('git_missing');
          return false;
        }
        
        // Try alternative repository URL if available
        const alternateRepo = config.repositories?.mirror || null;
        
        if (alternateRepo) {
          this.logger.info(`Pokouším se použít alternativní repozitář: ${alternateRepo}`);
          
          try {
            if (targetDir && fs.existsSync(targetDir)) {
              this.logger.info(`Odstraňuji existující adresář: ${targetDir}`);
              fs.rmdirSync(targetDir, { recursive: true });
            }
            
            await this.executeCommand(`git clone ${alternateRepo} ${targetDir || ''}`, { timeout: 300000 });
            success = true;
          } catch (cloneError) {
            this.logger.error(`Selhalo klonování z alternativního repozitáře: ${cloneError.message}`);
          }
        }
        
        // If alternate repo failed or wasn't available, try ZIP download
        if (!success && config.repositories?.zipUrl) {
          this.logger.info(`Pokouším se stáhnout ZIP archiv: ${config.repositories.zipUrl}`);
          
          const platform = process.platform;
          const tempDir = config.tempPath?.[platform] || 
                        (platform === 'win32' ? '%TEMP%\\candy-ai-temp' : '/tmp/candy-ai-temp');
          
          const expandedTempDir = platform === 'win32' ? 
            tempDir.replace(/%([^%]+)%/g, (_, n) => process.env[n]) : tempDir;
          
          // Ensure temp directory exists
          if (!fs.existsSync(expandedTempDir)) {
            fs.mkdirSync(expandedTempDir, { recursive: true });
          }
          
          const zipPath = path.join(expandedTempDir, 'repo.zip');
          
          try {
            // Download ZIP file
            if (platform === 'win32') {
              await this.executeCommand(
                `powershell -Command "& {Invoke-WebRequest -Uri '${config.repositories.zipUrl}' -OutFile '${zipPath}'}"`,
                { timeout: 300000 }
              );
            } else {
              await this.executeCommand(`curl -L "${config.repositories.zipUrl}" -o "${zipPath}"`, { timeout: 300000 });
            }
            
            // Extract ZIP file
            if (targetDir && fs.existsSync(targetDir)) {
              this.logger.info(`Odstraňuji existující adresář: ${targetDir}`);
              fs.rmdirSync(targetDir, { recursive: true });
            }
            
            // Create target directory if it doesn't exist
            if (targetDir && !fs.existsSync(targetDir)) {
              fs.mkdirSync(targetDir, { recursive: true });
            }
            
            if (platform === 'win32') {
              await this.executeCommand(
                `powershell -Command "& {Expand-Archive -Path '${zipPath}' -DestinationPath '${targetDir || '.'}'}"`,
                { timeout: 180000 }
              );
            } else {
              await this.executeCommand(`unzip "${zipPath}" -d "${targetDir || '.'}"`, { timeout: 180000 });
            }
            
            success = true;
          } catch (zipError) {
            this.logger.error(`Selhalo stažení nebo rozbalení ZIP archivu: ${zipError.message}`);
          }
        }
        
        // If all else failed, try to fix the existing Git repo
        if (!success && targetDir && fs.existsSync(path.join(targetDir, '.git'))) {
          this.logger.info('Pokouším se opravit existující Git repozitář...');
          
          try {
            // Try to reset and clean the repo
            await this.executeCommand('git reset --hard HEAD', { cwd: targetDir, timeout: 60000 });
            await this.executeCommand('git clean -fd', { cwd: targetDir, timeout: 60000 });
            
            // Try to fetch latest changes
            await this.executeCommand('git fetch origin', { cwd: targetDir, timeout: 120000 });
            await this.executeCommand('git checkout -f master || git checkout -f main', { cwd: targetDir, timeout: 60000 });
            await this.executeCommand('git reset --hard origin/master || git reset --hard origin/main', { cwd: targetDir, timeout: 60000 });
            
            success = true;
          } catch (gitFixError) {
            this.logger.error(`Selhala oprava existujícího Git repozitáře: ${gitFixError.message}`);
          }
        }
      } catch (error) {
        this.logger.error(`Selhala oprava klonování Git repozitáře: ${error.message}`);
      }
      
      return success;
    });
    
    // Files corrupted
    this.solutions.set('files_corrupted', async (config, details) => {
      this.logger.info('Pokouším se opravit poškozené soubory...');
      
      let success = false;
      const { files, checksumFile, installDir } = details || {};
      
      if (!installDir) {
        this.logger.error('Nelze opravit soubory, chybí instalační adresář');
        return false;
      }
      
      try {
        // If we have specific files that are corrupted
        if (Array.isArray(files) && files.length > 0) {
          this.logger.info(`Pokouším se opravit ${files.length} poškozených souborů...`);
          
          // Try to repair/re-download the files
          let allFilesRepaired = true;
          
          for (const file of files) {
            const filePath = path.join(installDir, file);
            const fileDir = path.dirname(filePath);
            
            // Try to redownload the file from repository
            try {
              if (!fs.existsSync(fileDir)) {
                fs.mkdirSync(fileDir, { recursive: true });
              }
              
              const repoUrl = config.repositories?.primary || 'https://github.com/candy-ai/candy-ai-clone';
              const fileUrl = `${repoUrl.replace('.git', '')}/raw/main/${file}`;
              
              this.logger.info(`Stahuji soubor z: ${fileUrl}`);
              
              const platform = process.platform;
              if (platform === 'win32') {
                await this.executeCommand(
                  `powershell -Command "& {Invoke-WebRequest -Uri '${fileUrl}' -OutFile '${filePath}'}"`,
                  { timeout: 60000 }
                );
              } else {
                await this.executeCommand(`curl -L "${fileUrl}" -o "${filePath}"`, { timeout: 60000 });
              }
              
              this.logger.info(`Soubor ${file} byl úspěšně opraven`);
            } catch (fileError) {
              this.logger.error(`Nelze opravit soubor ${file}: ${fileError.message}`);
              allFilesRepaired = false;
            }
          }
          
          success = allFilesRepaired;
        } 
        // If we have a checksum file, verify and repair all files
        else if (checksumFile) {
          this.logger.info('Ověřuji integritu souborů podle kontrolních součtů...');
          
          // Implementation would depend on the format of the checksum file
          // This is a simplified version assuming a format like: HASH FILENAME
          try {
            const checksumPath = path.join(installDir, checksumFile);
            const checksumContent = fs.readFileSync(checksumPath, 'utf8');
            const checksumLines = checksumContent.split('\n').filter(line => line.trim());
            
            let allVerified = true;
            const corruptedFiles = [];
            
            for (const line of checksumLines) {
              const [expectedHash, filePath] = line.trim().split(/\s+/);
              if (!expectedHash || !filePath) continue;
              
              const fullPath = path.join(installDir, filePath);
              
              // Skip if file doesn't exist (might be optional)
              if (!fs.existsSync(fullPath)) continue;
              
              // Verify file integrity
              const crypto = require('crypto');
              const fileBuffer = fs.readFileSync(fullPath);
              const actualHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
              
              if (actualHash !== expectedHash) {
                this.logger.warn(`Soubor ${filePath} je poškozen`);
                corruptedFiles.push(filePath);
                allVerified = false;
              }
            }
            
            // If we found corrupted files, try to repair them
            if (corruptedFiles.length > 0) {
              return await this.solutions.get('files_corrupted')(config, { files: corruptedFiles, installDir });
            }
            
            success = allVerified;
          } catch (checksumError) {
            this.logger.error(`Nelze ověřit integritu souborů: ${checksumError.message}`);
          }
        }
        // If we don't have specific information, try to reinstall/repair everything
        else {
          this.logger.info('Pokouším se opravit všechny soubory v instalaci...');
          
          // If it's a Git repository, try to reset it
          if (fs.existsSync(path.join(installDir, '.git'))) {
            try {
              await this.executeCommand('git reset --hard HEAD', { cwd: installDir, timeout: 60000 });
              await this.executeCommand('git clean -fd', { cwd: installDir, timeout: 60000 });
              await this.executeCommand('git fetch origin', { cwd: installDir, timeout: 120000 });
              await this.executeCommand('git checkout -f master || git checkout -f main', { cwd: installDir, timeout: 60000 });
              
              success = true;
            } catch (gitError) {
              this.logger.error(`Nelze opravit instalaci pomocí Git: ${gitError.message}`);
              
              // If Git fails, try to reinstall using ZIP
              success = await this.solutions.get('git_clone_failed')(config, { 
                repository: config.repositories?.primary, 
                targetDir: installDir 
              });
            }
          } else {
            // If it's not a Git repository, try to reinstall using ZIP
            success = await this.solutions.get('git_clone_failed')(config, { 
              repository: config.repositories?.primary, 
              targetDir: installDir 
            });
          }
        }
      } catch (error) {
        this.logger.error(`Selhala oprava poškozených souborů: ${error.message}`);
      }
      
      return success;
    });
  }

  /**
   * Registers a problem for repair
   * @param {string} problemType - Type of problem from PROBLEM_DESCRIPTIONS
   * @param {Object} [details={}] - Additional details about the problem
   */
  registerProblem(problemType, details = {}) {
    // Check if the problem type is valid
    if (!PROBLEM_DESCRIPTIONS[problemType]) {
      this.logger.warn(`Neznámý typ problému: ${problemType}`);
    }
    
    this.problemRegistry.set(problemType, {
      timestamp: new Date(),
      details,
      attemptCount: (this.problemRegistry.get(problemType)?.attemptCount || 0) + 1
    });
    
    this.logger.warn(`Detekován problém: ${problemType} - ${PROBLEM_DESCRIPTIONS[problemType] || 'Neznámý problém'}`);
    
    // Return the problem for chaining
    return this.problemRegistry.get(problemType);
  }

  /**
   * Attempts to repair a registered problem
   * @param {string} problemType - Type of problem to repair
   * @param {Object} [config={}] - Configuration for the repair operation
   * @returns {Promise<boolean>} True if repair was successful
   */
  async repairProblem(problemType, config = {}) {
    const problem = this.problemRegistry.get(problemType);
    if (!problem) {
      this.logger.warn(`Nelze opravit neregistrovaný problém: ${problemType}`);
      return false;
    }
    
    if (problem.attemptCount > this.maxRepairAttempts) {
      this.logger.error(`Dosažen maximální počet pokusů o opravu problému: ${problemType}`);
      return false;
    }
    
    const solution = this.solutions.get(problemType);
    if (!solution) {
      this.logger.error(`Nenalezeno řešení pro problém: ${problemType}`);
      return false;
    }
    
    this.logger.info(`Zahájení opravy problému: ${problemType} (pokus ${problem.attemptCount}/${this.maxRepairAttempts})`);
    
    // Calculate retry delay with exponential backoff
    const baseDelay = config.retryDelay || 2000;
    const multiplier = config.retryMultiplier || 1.5;
    const maxDelay = config.maxRetryDelay || 10000;
    const delay = Math.min(baseDelay * Math.pow(multiplier, problem.attemptCount - 1), maxDelay);
    
    let result = false;
    
    try {
      // Use the withRetry helper if we have it, otherwise just try once
      if (typeof withRetry === 'function') {
        result = await withRetry(async () => {
          return await solution(config, problem.details);
        }, {
          maxRetries: 1, // We already track attempts at a higher level
          retryDelay: delay,
          shouldRetry: (error) => {
            // Only retry on network errors or specific recoverable errors
            return error.type === ERROR_TYPES.NETWORK || 
                   error.recoveryStrategies.includes(RECOVERY_STRATEGIES.RETRY);
          },
          errorOptions: {
            component: 'auto-repair',
            operation: `repair_${problemType}`
          }
        });
      } else {
        // Just try once if withRetry isn't available
        result = await solution(config, problem.details);
      }
    } catch (error) {
      this.logger.error(`Výjimka při opravě problému ${problemType}: ${error.message}`);
      result = false;
    }
    
    if (result) {
      this.logger.info(`Problém ${problemType} byl úspěšně opraven`);
      this.problemRegistry.delete(problemType);
    } else {
      this.logger.error(`Oprava problému ${problemType} selhala`);
    }
    
    return result;
  }

  /**
   * Checks system dependencies
   * @param {Object} [config={}] - Configuration for the dependency check
   * @returns {Promise<Object>} Result with success status and list of problems
   */
  async checkDependencies(config = {}) {
    this.logger.info('Kontroluji systémové závislosti...');
    
    const result = {
      success: true,
      problems: []
    };
    
    // Check Node.js
    try {
      const nodeVersion = execSync('node -v').toString().trim().replace(/^v/, '');
      this.logger.info(`Nalezen Node.js: ${nodeVersion}`);
      
      // Check if version meets minimum requirement
      if (!this.isVersionCompatible(nodeVersion, this.dependencies.node.minVersion)) {
        this.logger.warn(`Node.js verze ${nodeVersion} nesplňuje minimální požadavek ${this.dependencies.node.minVersion}`);
        this.registerProblem('node_outdated', { currentVersion: nodeVersion, requiredVersion: this.dependencies.node.minVersion });
        
        if (this.dependencies.node.required) {
          result.success = false;
          result.problems.push('node_outdated');
        }
      }
    } catch (nodeError) {
      this.logger.error(`Node.js není nainstalován nebo nelze najít: ${nodeError.message}`);
      this.registerProblem('node_missing');
      
      if (this.dependencies.node.required) {
        result.success = false;
        result.problems.push('node_missing');
      }
    }
    
    // Check NPM
    try {
      const npmVersion = execSync('npm -v').toString().trim();
      this.logger.info(`Nalezen NPM: ${npmVersion}`);
      
      // Check if version meets minimum requirement
      if (!this.isVersionCompatible(npmVersion, this.dependencies.npm.minVersion)) {
        this.logger.warn(`NPM verze ${npmVersion} nesplňuje minimální požadavek ${this.dependencies.npm.minVersion}`);
        this.registerProblem('npm_outdated', { currentVersion: npmVersion, requiredVersion: this.dependencies.npm.minVersion });
        
        if (this.dependencies.npm.required) {
          result.success = false;
          result.problems.push('npm_outdated');
        }
      }
    } catch (npmError) {
      this.logger.error(`NPM není nainstalován nebo nelze najít: ${npmError.message}`);
      this.registerProblem('npm_missing');
      
      if (this.dependencies.npm.required) {
        result.success = false;
        result.problems.push('npm_missing');
      }
    }
    
    // Check Git (if configured)
    if (config.checkGit !== false) {
      try {
        const gitVersion = execSync('git --version').toString().trim().replace(/^git version /, '');
        this.logger.info(`Nalezen Git: ${gitVersion}`);
        
        // Check if version meets minimum requirement
        if (!this.isVersionCompatible(gitVersion, this.dependencies.git.minVersion)) {
          this.logger.warn(`Git verze ${gitVersion} nesplňuje minimální požadavek ${this.dependencies.git.minVersion}`);
          this.registerProblem('git_outdated', { currentVersion: gitVersion, requiredVersion: this.dependencies.git.minVersion });
          
          if (this.dependencies.git.required) {
            result.success = false;
            result.problems.push('git_outdated');
          }
        }
      } catch (gitError) {
        this.logger.warn(`Git není nainstalován nebo nelze najít: ${gitError.message}`);
        this.registerProblem('git_missing');
        
        if (this.dependencies.git.required) {
          result.success = false;
          result.problems.push('git_missing');
        }
      }
    }
    
    // Check Docker (if configured)
    if (config.checkDocker) {
      try {
        const dockerVersion = execSync('docker --version').toString().trim().replace(/^Docker version /, '').split(',')[0];
        this.logger.info(`Nalezen Docker: ${dockerVersion}`);
        
        // Check if version meets minimum requirement
        if (!this.isVersionCompatible(dockerVersion, this.dependencies.docker.minVersion)) {
          this.logger.warn(`Docker verze ${dockerVersion} nesplňuje minimální požadavek ${this.dependencies.docker.minVersion}`);
          this.registerProblem('docker_outdated', { currentVersion: dockerVersion, requiredVersion: this.dependencies.docker.minVersion });
          
          if (this.dependencies.docker.required) {
            result.success = false;
            result.problems.push('docker_outdated');
          }
        }
      } catch (dockerError) {
        this.logger.warn(`Docker není nainstalován nebo nelze najít: ${dockerError.message}`);
        this.registerProblem('docker_missing');
        
        if (this.dependencies.docker.required) {
          result.success = false;
          result.problems.push('docker_missing');
        }
      }
    }
    
    // Check disk space
    if (config.checkDiskSpace) {
      try {
        const installPath = config.installPath || process.cwd();
        let freeSpace = 0;
        
        if (process.platform === 'win32') {
          const drive = path.parse(installPath).root.charAt(0);
          const result = execSync(`wmic logicaldisk where DeviceID="${drive}:" get FreeSpace`).toString();
          const match = result.match(/\d+/);
          if (match) {
            freeSpace = parseInt(match[0]) / (1024 * 1024 * 1024); // Convert to GB
          }
        } else {
          const result = execSync(`df -k "${installPath}"`).toString();
          const match = result.match(/\d+\s+\d+\s+(\d+)/);
          if (match) {
            freeSpace = parseInt(match[1]) / (1024 * 1024); // Convert to GB
          }
        }
        
        this.logger.info(`Volné místo na disku: ${freeSpace.toFixed(2)} GB`);
        
        const requiredSpace = config.requiredDiskSpace || 10; // 10 GB default
        if (freeSpace < requiredSpace) {
          this.logger.error(`Nedostatek místa na disku. Dostupno: ${freeSpace.toFixed(2)} GB, Požadováno: ${requiredSpace} GB`);
          this.registerProblem('disk_space_low', { available: freeSpace, required: requiredSpace });
          result.success = false;
          result.problems.push('disk_space_low');
        }
      } catch (diskError) {
        this.logger.warn(`Nelze zjistit volné místo na disku: ${diskError.message}`);
      }
    }
    
    // Check for corrupted files if we're in repair mode
    if (config.checkFileIntegrity && config.installPath && fs.existsSync(config.installPath)) {
      try {
        this.logger.info('Kontroluji integritu souborů...');
        
        // Basic integrity check: check for critical files
        const criticalFiles = [
          'install.html',
          'web-install.bat',
          'utils/error-handler.js',
          'utils/logger.js',
          'config/installer-config.json'
        ];
        
        const missingFiles = [];
        
        for (const file of criticalFiles) {
          const filePath = path.join(config.installPath, file);
          if (!fs.existsSync(filePath)) {
            this.logger.warn(`Chybí kritický soubor: ${file}`);
            missingFiles.push(file);
          }
        }
        
        if (missingFiles.length > 0) {
          this.logger.error(`Nalezeny chybějící soubory: ${missingFiles.join(', ')}`);
          this.registerProblem('files_corrupted', { files: missingFiles, installDir: config.installPath });
          result.success = false;
          result.problems.push('files_corrupted');
        }
      } catch (integrityError) {
        this.logger.warn(`Nelze zkontrolovat integritu souborů: ${integrityError.message}`);
      }
    }
    
    return result;
  }

  /**
   * Resolves detected problems
   * @param {Object} [config={}] - Configuration for the resolution process
   * @param {Array<string>} [problems=[]] - List of problems to resolve
   * @returns {Promise<boolean>} True if all problems were resolved
   */
  async resolveProblems(config = {}, problems = []) {
    if (!problems || problems.length === 0) {
      this.logger.info('Nebyly detekovány žádné problémy k vyřešení');
      return true;
    }
    
    this.logger.info(`Řeším ${problems.length} detekovaných problémů...`);
    
    let allFixed = true;
    for (const problem of problems) {
      const fixed = await this.repairProblem(problem, config);
      if (!fixed) {
        allFixed = false;
        this.logger.error(`Problém ${problem} se nepodařilo opravit`);
      }
    }
    
    return allFixed;
  }

  /**
   * Executes an operation with retry capability
   * @param {Function} operation - Function to execute
   * @param {number} [maxAttempts=3] - Maximum number of attempts
   * @param {number} [delay=2000] - Delay between attempts in milliseconds
   * @returns {Promise<*>} Result of the operation
   */
  async withRetry(operation, maxAttempts = 3, delay = 2000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation(attempt);
      } catch (error) {
        lastError = error;
        
        if (attempt < maxAttempts) {
          this.logger.warn(`Pokus ${attempt}/${maxAttempts} selhal: ${error.message}. Další pokus za ${delay/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Increase delay for next attempt with exponential backoff
          delay = Math.min(delay * 1.5, 10000);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Checks if a version meets compatibility requirements
   * @param {string} version - Version to check
   * @param {string} requiredVersion - Minimum required version
   * @returns {boolean} True if version is compatible
   */
  isVersionCompatible(version, requiredVersion) {
    // Parse versions and compare components
    const parseVersion = (v) => {
      const parts = v.split('.');
      return {
        major: parseInt(parts[0], 10) || 0,
        minor: parseInt(parts[1], 10) || 0,
        patch: parseInt(parts[2], 10) || 0
      };
    };
    
    try {
      const verA = parseVersion(version);
      const verB = parseVersion(requiredVersion);
      
      // Compare major version first
      if (verA.major > verB.major) return true;
      if (verA.major < verB.major) return false;
      
      // Major versions are equal, compare minor
      if (verA.minor > verB.minor) return true;
      if (verA.minor < verB.minor) return false;
      
      // Minor versions are equal, compare patch
      return verA.patch >= verB.patch;
    } catch (error) {
      this.logger.error(`Chyba při porovnání verzí ${version} a ${requiredVersion}: ${error.message}`);
      return false;
    }
  }

  /**
   * Executes a shell command
   * @param {string} command - Command to execute
   * @param {Object} [options={}] - Execution options
   * @returns {Promise<string>} Command output
   * @private
   */
  async _executeCommand(command, options = {}) {
    this.logger.debug(`Spouštím příkaz: ${command}`);
    
    try {
      const { stdout, stderr } = await execAsync(command, options);
      
      if (stderr && stderr.trim()) {
        this.logger.warn(`Příkaz vrátil chyby: ${stderr}`);
      }
      
      return stdout.trim();
    } catch (error) {
      this.logger.error(`Selhalo spuštění příkazu ${command}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Performs a full system check and repairs any issues
   * @param {Object} [config={}] - Configuration for the check
   * @returns {Promise<Object>} Check results
   */
  async performSystemCheck(config = {}) {
    this.logger.info('Zahajuji kompletní kontrolu systému...');
    
    const results = {
      dependencyCheck: null,
      fileIntegrityCheck: null,
      repairAttempts: 0,
      successfulRepairs: 0,
      remainingIssues: []
    };
    
    // Check dependencies
    results.dependencyCheck = await this.checkDependencies(config);
    
    // Collect problems to resolve
    let problemsToResolve = [...results.dependencyCheck.problems];
    
    // Resolve problems
    if (problemsToResolve.length > 0) {
      results.repairAttempts += problemsToResolve.length;
      
      const resolved = await this.resolveProblems(config, problemsToResolve);
      
      if (resolved) {
        results.successfulRepairs += problemsToResolve.length;
      } else {
        // Check which problems were resolved
        for (const problem of problemsToResolve) {
          if (!this.problemRegistry.has(problem)) {
            results.successfulRepairs++;
          } else {
            results.remainingIssues.push(problem);
          }
        }
      }
    }
    
    this.logger.info(`Kontrola systému dokončena. Nalezeno problémů: ${results.repairAttempts}, Opraveno: ${results.successfulRepairs}`);
    
    return results;
  }
}

// Export the module
module.exports = {
  AutoRepairService,
  PROBLEM_DESCRIPTIONS
};