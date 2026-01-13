/**
 * Build Installer Script
 * 
 * Automates the build and packaging process for the Candy AI application.
 * This script handles both backend and frontend builds, then packages the
 * application for distribution.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Get project directories
const projectRoot = path.resolve(__dirname, '..');
const frontendDir = path.join(projectRoot, 'frontend');
const backendDir = path.join(projectRoot, 'backend');
const distDir = path.join(projectRoot, 'dist');
const resourcesDir = path.join(frontendDir, 'resources');

// Parse command line arguments
const args = process.argv.slice(2);
const platform = args.find(arg => ['--win', '--mac', '--linux', '--all'].includes(arg)) || '--win';
const publish = args.includes('--publish');

/**
 * Run a command and return a promise
 * @param {string} command - Command to run
 * @param {string[]} args - Command arguments
 * @param {Object} options - Spawn options
 * @returns {Promise} Promise resolving to exit code
 */
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`${colors.bright}${colors.cyan}> ${command} ${args.join(' ')}${colors.reset}\n`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });
    
    child.on('exit', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Create resources directory with necessary files
 */
async function prepareResources() {
  try {
    console.log(`\n${colors.bright}${colors.blue}Preparing resources...${colors.reset}\n`);
    
    // Create resources directory if it doesn't exist
    await fs.ensureDir(resourcesDir);
    
    // Copy backend files to resources
    await fs.copy(backendDir, path.join(resourcesDir, 'backend'), {
      filter: (src) => {
        // Exclude node_modules, tests, and other unnecessary files
        return !src.includes('node_modules') && 
               !src.includes('tests') && 
               !src.endsWith('.log') &&
               !src.endsWith('.git');
      }
    });
    
    // Copy docker configuration
    await fs.copy(
      path.join(projectRoot, 'docker'), 
      path.join(resourcesDir, 'docker')
    );
    
    // Create package.json for the resources/backend directory
    const backendPackageJson = await fs.readJson(path.join(backendDir, 'package.json'));
    
    // Save a clean version of package.json without dev dependencies
    const cleanPackageJson = {
      ...backendPackageJson,
      devDependencies: {}
    };
    
    await fs.writeJson(
      path.join(resourcesDir, 'backend', 'package.json'),
      cleanPackageJson,
      { spaces: 2 }
    );
    
    console.log(`${colors.green}Resources prepared successfully${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error preparing resources: ${error.message}${colors.reset}`);
    throw error;
  }
}

/**
 * Build the backend
 */
async function buildBackend() {
  try {
    console.log(`\n${colors.bright}${colors.blue}Building backend...${colors.reset}\n`);
    
    // Change to backend directory
    process.chdir(backendDir);
    
    // Install dependencies
    await runCommand('npm', ['install', '--production']);
    
    console.log(`${colors.green}Backend built successfully${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error building backend: ${error.message}${colors.reset}`);
    throw error;
  }
}

/**
 * Build the frontend
 */
async function buildFrontend() {
  try {
    console.log(`\n${colors.bright}${colors.blue}Building frontend...${colors.reset}\n`);
    
    // Change to frontend directory
    process.chdir(frontendDir);
    
    // Install dependencies
    await runCommand('npm', ['install']);
    
    // Build React app
    await runCommand('npm', ['run', 'build']);
    
    console.log(`${colors.green}Frontend built successfully${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error building frontend: ${error.message}${colors.reset}`);
    throw error;
  }
}

/**
 * Package the application
 */
async function packageApp() {
  try {
    console.log(`\n${colors.bright}${colors.blue}Packaging application...${colors.reset}\n`);
    
    // Change to frontend directory
    process.chdir(frontendDir);
    
    // Determine packaging command based on platform
    let packageCommand;
    switch (platform) {
      case '--mac':
        packageCommand = 'package-mac';
        break;
      case '--linux':
        packageCommand = 'package-linux';
        break;
      case '--all':
        packageCommand = 'package-all';
        break;
      default:
        packageCommand = 'package'; // Default to Windows
    }
    
    // Add publish flag if specified
    if (publish) {
      packageCommand = 'publish';
    }
    
    // Run packaging command
    await runCommand('npm', ['run', packageCommand]);
    
    // Copy installers to dist directory
    await fs.ensureDir(distDir);
    await fs.copy(
      path.join(frontendDir, 'dist'),
      distDir
    );
    
    console.log(`${colors.green}Application packaged successfully${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error packaging application: ${error.message}${colors.reset}`);
    throw error;
  }
}

/**
 * Main build process
 */
async function build() {
  try {
    console.log(`${colors.bright}${colors.magenta}Candy AI Installer Build${colors.reset}\n`);
    console.log(`Platform: ${platform.replace('--', '')}`);
    console.log(`Publish: ${publish ? 'Yes' : 'No'}`);
    
    // Clean dist directory
    if (fs.existsSync(distDir)) {
      await fs.remove(distDir);
    }
    
    // Run build steps
    await prepareResources();
    await buildBackend();
    await buildFrontend();
    await packageApp();
    
    console.log(`\n${colors.bright}${colors.green}Build completed successfully!${colors.reset}`);
    console.log(`Installers are available in: ${colors.cyan}${distDir}${colors.reset}`);
  } catch (error) {
    console.error(`\n${colors.bright}${colors.red}Build failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Start the build process
build();