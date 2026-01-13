#!/usr/bin/env node

/**
 * Test Runner Script
 * 
 * Runs all tests for the Candy AI application.
 * Usage: node run-tests.js [--frontend] [--backend] [--watch]
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Parse arguments
const args = process.argv.slice(2);
const runFrontend = args.includes('--frontend') || (!args.includes('--backend') && !args.includes('--frontend'));
const runBackend = args.includes('--backend') || (!args.includes('--backend') && !args.includes('--frontend'));
const watchMode = args.includes('--watch');

// Get project root
const projectRoot = path.resolve(__dirname, '..');

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
 * Run backend tests
 */
async function runBackendTests() {
  const backendDir = path.join(projectRoot, 'backend');
  
  // Check if backend directory exists
  if (!fs.existsSync(backendDir)) {
    console.log(`${colors.yellow}Backend directory not found. Skipping backend tests.${colors.reset}`);
    return;
  }
  
  try {
    console.log(`\n${colors.bright}${colors.blue}Running backend tests...${colors.reset}\n`);
    
    // Change to backend directory
    process.chdir(backendDir);
    
    // Run npm test with or without watch mode
    const testArgs = watchMode ? ['test', '--', '--watch'] : ['test'];
    await runCommand('npm', testArgs);
    
    console.log(`\n${colors.green}✓ Backend tests completed successfully${colors.reset}\n`);
  } catch (error) {
    console.error(`\n${colors.red}✗ Backend tests failed: ${error.message}${colors.reset}\n`);
    throw error;
  }
}

/**
 * Run frontend tests
 */
async function runFrontendTests() {
  const frontendDir = path.join(projectRoot, 'frontend');
  
  // Check if frontend directory exists
  if (!fs.existsSync(frontendDir)) {
    console.log(`${colors.yellow}Frontend directory not found. Skipping frontend tests.${colors.reset}`);
    return;
  }
  
  try {
    console.log(`\n${colors.bright}${colors.blue}Running frontend tests...${colors.reset}\n`);
    
    // Change to frontend directory
    process.chdir(frontendDir);
    
    // Run npm test with or without watch mode
    const testCommand = watchMode ? 'test' : 'test -- --watchAll=false';
    await runCommand('npm', ['run', testCommand]);
    
    console.log(`\n${colors.green}✓ Frontend tests completed successfully${colors.reset}\n`);
  } catch (error) {
    console.error(`\n${colors.red}✗ Frontend tests failed: ${error.message}${colors.reset}\n`);
    throw error;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log(`${colors.bright}${colors.magenta}Candy AI Test Runner${colors.reset}\n`);
  
  try {
    // Run backend tests if requested
    if (runBackend) {
      await runBackendTests();
    }
    
    // Run frontend tests if requested
    if (runFrontend) {
      await runFrontendTests();
    }
    
    console.log(`${colors.bright}${colors.green}All tests completed successfully!${colors.reset}`);
  } catch (error) {
    console.error(`${colors.bright}${colors.red}Tests failed!${colors.reset}`);
    process.exit(1);
  }
}

// Run the tests
runTests();