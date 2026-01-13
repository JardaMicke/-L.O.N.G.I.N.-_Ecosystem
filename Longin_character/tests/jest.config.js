/**
 * @fileoverview Jest Configuration for Candy AI Clone
 * 
 * Comprehensive Jest configuration for testing all aspects of the application
 * including backend services, frontend components, and utilities.
 * 
 * @module jest.config
 * @version 1.0.0
 * @author Candy AI Team
 * @license MIT
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Files to match as tests
  testMatch: [
    '**/*.test.js',
    '**/*.spec.js'
  ],
  
  // Files to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],
  
  // Files to transform with babel
  transform: {
    '^.+\\.jsx?$': 'babel-jest'
  },
  
  // Collect coverage from these directories
  collectCoverageFrom: [
    '../backend/**/*.js',
    '../frontend/src/**/*.js',
    '../utils/**/*.js',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/build/**'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90
    },
    '../backend/': {
      statements: 95,
      branches: 90,
      functions: 95,
      lines: 95
    },
    '../utils/': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100
    }
  },
  
  // Coverage output directory
  coverageDirectory: 'coverage',
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  
  // Module name mappings
  moduleNameMapper: {
    // Handle CSS imports (mock them)
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    
    // Handle image imports (mock them)
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
    
    // Module path aliases
    '^@/(.*)$': '<rootDir>/../$1'
  },
  
  // Setup files
  setupFiles: [
    '<rootDir>/setupTests.js'
  ],
  
  // Setup files after environment is set up
  setupFilesAfterEnv: [
    '<rootDir>/setupTestsAfterEnv.js'
  ],
  
  // Test timeout
  testTimeout: 10000,
  
  // Global test variables
  globals: {
    __TEST__: true
  },
  
  // Watch options
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
  // Verbose output
  verbose: true,
  
  // Automatically clear mock calls between tests
  clearMocks: true,
  
  // Reset mocks between tests
  resetMocks: false,
  
  // Restore mocks between tests
  restoreMocks: false,
  
  // Detect open handles
  detectOpenHandles: true,
  
  // Force coverage collection
  collectCoverage: false,
  
  // Projects configuration for monorepo setup
  projects: [
    {
      displayName: 'backend',
      testMatch: ['<rootDir>/../backend/**/*.test.js'],
      testEnvironment: 'node'
    },
    {
      displayName: 'frontend',
      testMatch: ['<rootDir>/../frontend/src/**/*.test.js'],
      testEnvironment: 'jsdom'
    },
    {
      displayName: 'utils',
      testMatch: ['<rootDir>/../utils/**/*.test.js'],
      testEnvironment: 'node'
    }
  ],
  
  // Additional reporters
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './coverage/junit',
      outputName: 'junit.xml'
    }]
  ]
};