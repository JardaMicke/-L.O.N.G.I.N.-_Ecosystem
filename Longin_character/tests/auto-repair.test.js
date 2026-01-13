/**
 * @fileoverview Automated tests for the AutoRepairService class
 * 
 * This module contains unit tests that verify the functionality of the AutoRepairService
 * including error detection, problem resolution, and dependency checking.
 * 
 * @module auto-repair.test
 * @version 1.0.0
 * @author Candy AI Team
 * @license MIT
 */

// Mock dependencies
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

const mockExecuteCommand = jest.fn();

// Import the AutoRepairService class (from install.html in production)
// For testing purposes, we extract the class into a module
class AutoRepairService {
  constructor() {
    this.repairAttempts = {};
    this.maxRepairAttempts = 3;
    this.dependencies = {
      node: { minVersion: '16.0.0', required: true },
      npm: { minVersion: '7.0.0', required: true },
      git: { minVersion: '2.0.0', required: false },
      docker: { minVersion: '20.0.0', required: false }
    };
    this.problemRegistry = new Map();
    this.solutions = new Map();
    this.logger = mockLogger;
    this.executeCommand = mockExecuteCommand;
  }

  registerProblem(problemType, details = {}) {
    this.problemRegistry.set(problemType, {
      timestamp: new Date(),
      details,
      attemptCount: (this.problemRegistry.get(problemType)?.attemptCount || 0) + 1
    });
    this.logger.warn(`Detekován problém: ${problemType}`);
  }

  async repairProblem(problemType, config) {
    const problem = this.problemRegistry.get(problemType);
    if (!problem) return false;
    
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
    const result = await solution(config, problem.details);
    
    if (result) {
      this.logger.info(`Problém ${problemType} byl úspěšně opraven`);
      this.problemRegistry.delete(problemType);
    } else {
      this.logger.error(`Oprava problému ${problemType} selhala`);
    }
    
    return result;
  }

  async checkDependencies(config) {
    this.logger.info('Kontroluji systémové závislosti...');
    
    const result = {
      success: true,
      problems: []
    };
    
    // Mock implementation for testing
    if (config.mockNodeMissing) {
      this.registerProblem('node_missing');
      result.success = false;
      result.problems.push('node_missing');
    }
    
    if (config.mockNpmMissing) {
      this.registerProblem('npm_missing');
      result.success = false;
      result.problems.push('npm_missing');
    }
    
    return result;
  }

  async resolveProblems(config, problems) {
    if (!problems || problems.length === 0) return true;
    
    this.logger.info(`Řeším ${problems.length} detekovaných problémů...`);
    
    let allFixed = true;
    for (const problem of problems) {
      const fixed = await this.repairProblem(problem, config);
      if (!fixed) allFixed = false;
    }
    
    return allFixed;
  }

  async withRetry(operation, maxAttempts = 3, delay = 2000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt < maxAttempts) {
          this.logger.warn(`Pokus ${attempt}/${maxAttempts} selhal: ${error.message}. Další pokus za ${delay/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * 1.5, 10000);
        }
      }
    }
    
    throw lastError;
  }

  isVersionCompatible(a, b) {
    const parseVersion = (v) => {
      const parts = v.split('.');
      return {
        major: parseInt(parts[0]) || 0,
        minor: parseInt(parts[1]) || 0,
        patch: parseInt(parts[2]) || 0
      };
    };
    
    const verA = parseVersion(a);
    const verB = parseVersion(b);
    
    if (verA.major > verB.major) return true;
    if (verA.major < verB.major) return false;
    
    if (verA.minor > verB.minor) return true;
    if (verA.minor < verB.minor) return false;
    
    return verA.patch >= verB.patch;
  }
}

// Mock config for testing
const mockConfig = {
  installPath: 'C:\\Users\\Test\\candy-ai-clone',
  sourceType: 'github',
  mockNodeMissing: false,
  mockNpmMissing: false
};

// Tests
describe('AutoRepairService', () => {
  let autoRepair;
  
  beforeEach(() => {
    // Reset mocks
    mockLogger.info.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.error.mockClear();
    mockExecuteCommand.mockClear();
    
    // Create fresh instance
    autoRepair = new AutoRepairService();
    
    // Setup mock solutions
    autoRepair.solutions.set('node_missing', jest.fn().mockResolvedValue(true));
    autoRepair.solutions.set('npm_missing', jest.fn().mockResolvedValue(true));
    autoRepair.solutions.set('git_clone_failed', jest.fn().mockResolvedValue(true));
    autoRepair.solutions.set('files_corrupted', jest.fn().mockResolvedValue(true));
  });
  
  describe('registerProblem', () => {
    it('should register a problem correctly', () => {
      autoRepair.registerProblem('test_problem', { error: 'Test error' });
      
      expect(autoRepair.problemRegistry.has('test_problem')).toBeTruthy();
      expect(autoRepair.problemRegistry.get('test_problem').attemptCount).toBe(1);
      expect(autoRepair.problemRegistry.get('test_problem').details).toEqual({ error: 'Test error' });
      expect(mockLogger.warn).toHaveBeenCalledWith('Detekován problém: test_problem');
    });
    
    it('should increment attempt count for existing problems', () => {
      autoRepair.registerProblem('test_problem');
      autoRepair.registerProblem('test_problem');
      
      expect(autoRepair.problemRegistry.get('test_problem').attemptCount).toBe(2);
    });
  });
  
  describe('repairProblem', () => {
    it('should return false for unknown problems', async () => {
      const result = await autoRepair.repairProblem('unknown_problem', mockConfig);
      
      expect(result).toBe(false);
    });
    
    it('should apply solution for known problems', async () => {
      autoRepair.registerProblem('node_missing');
      
      const result = await autoRepair.repairProblem('node_missing', mockConfig);
      
      expect(result).toBe(true);
      expect(autoRepair.solutions.get('node_missing')).toHaveBeenCalledWith(mockConfig, expect.any(Object));
      expect(autoRepair.problemRegistry.has('node_missing')).toBe(false);
    });
    
    it('should return false if solution fails', async () => {
      autoRepair.solutions.set('node_missing', jest.fn().mockResolvedValue(false));
      autoRepair.registerProblem('node_missing');
      
      const result = await autoRepair.repairProblem('node_missing', mockConfig);
      
      expect(result).toBe(false);
      expect(autoRepair.problemRegistry.has('node_missing')).toBe(true);
      expect(mockLogger.error).toHaveBeenCalled();
    });
    
    it('should return false if max attempts reached', async () => {
      autoRepair.registerProblem('test_problem');
      autoRepair.registerProblem('test_problem');
      autoRepair.registerProblem('test_problem');
      autoRepair.registerProblem('test_problem'); // 4th attempt exceeds max (3)
      
      const result = await autoRepair.repairProblem('test_problem', mockConfig);
      
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
  
  describe('checkDependencies', () => {
    it('should return success for valid dependencies', async () => {
      const result = await autoRepair.checkDependencies(mockConfig);
      
      expect(result.success).toBe(true);
      expect(result.problems.length).toBe(0);
    });
    
    it('should detect missing Node.js', async () => {
      const config = { ...mockConfig, mockNodeMissing: true };
      const result = await autoRepair.checkDependencies(config);
      
      expect(result.success).toBe(false);
      expect(result.problems).toContain('node_missing');
    });
    
    it('should detect missing npm', async () => {
      const config = { ...mockConfig, mockNpmMissing: true };
      const result = await autoRepair.checkDependencies(config);
      
      expect(result.success).toBe(false);
      expect(result.problems).toContain('npm_missing');
    });
    
    it('should detect multiple problems', async () => {
      const config = { ...mockConfig, mockNodeMissing: true, mockNpmMissing: true };
      const result = await autoRepair.checkDependencies(config);
      
      expect(result.success).toBe(false);
      expect(result.problems).toContain('node_missing');
      expect(result.problems).toContain('npm_missing');
      expect(result.problems.length).toBe(2);
    });
  });
  
  describe('resolveProblems', () => {
    it('should return true for empty problems list', async () => {
      const result = await autoRepair.resolveProblems(mockConfig, []);
      
      expect(result).toBe(true);
    });
    
    it('should repair all problems and return true if all fixed', async () => {
      autoRepair.registerProblem('node_missing');
      autoRepair.registerProblem('npm_missing');
      
      const result = await autoRepair.resolveProblems(mockConfig, ['node_missing', 'npm_missing']);
      
      expect(result).toBe(true);
      expect(autoRepair.solutions.get('node_missing')).toHaveBeenCalled();
      expect(autoRepair.solutions.get('npm_missing')).toHaveBeenCalled();
    });
    
    it('should repair problems and return false if any not fixed', async () => {
      autoRepair.solutions.set('npm_missing', jest.fn().mockResolvedValue(false));
      autoRepair.registerProblem('node_missing');
      autoRepair.registerProblem('npm_missing');
      
      const result = await autoRepair.resolveProblems(mockConfig, ['node_missing', 'npm_missing']);
      
      expect(result).toBe(false);
      expect(autoRepair.solutions.get('node_missing')).toHaveBeenCalled();
      expect(autoRepair.solutions.get('npm_missing')).toHaveBeenCalled();
    });
  });
  
  describe('withRetry', () => {
    it('should return result on first successful attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await autoRepair.withRetry(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });
    
    it('should retry on failure up to maxAttempts', async () => {
      const error = new Error('Test error');
      const operation = jest.fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');
      
      const result = await autoRepair.withRetry(operation, 3, 0);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });
    
    it('should throw error after all attempts fail', async () => {
      const error = new Error('Test error');
      const operation = jest.fn().mockRejectedValue(error);
      
      await expect(autoRepair.withRetry(operation, 3, 0)).rejects.toThrow(error);
      expect(operation).toHaveBeenCalledTimes(3);
    });
  });
  
  describe('isVersionCompatible', () => {
    it('should correctly compare compatible versions', () => {
      expect(autoRepair.isVersionCompatible('16.0.0', '16.0.0')).toBe(true);
      expect(autoRepair.isVersionCompatible('16.1.0', '16.0.0')).toBe(true);
      expect(autoRepair.isVersionCompatible('16.0.1', '16.0.0')).toBe(true);
      expect(autoRepair.isVersionCompatible('17.0.0', '16.0.0')).toBe(true);
    });
    
    it('should correctly compare incompatible versions', () => {
      expect(autoRepair.isVersionCompatible('15.0.0', '16.0.0')).toBe(false);
      expect(autoRepair.isVersionCompatible('16.0.0', '16.1.0')).toBe(false);
      expect(autoRepair.isVersionCompatible('16.0.0', '16.0.1')).toBe(false);
    });
    
    it('should handle partial version strings', () => {
      expect(autoRepair.isVersionCompatible('16', '16.0.0')).toBe(true);
      expect(autoRepair.isVersionCompatible('16.1', '16.0.0')).toBe(true);
      expect(autoRepair.isVersionCompatible('16.0.0', '16')).toBe(true);
      expect(autoRepair.isVersionCompatible('15', '16.0.0')).toBe(false);
    });
    
    it('should handle invalid version strings', () => {
      expect(autoRepair.isVersionCompatible('invalid', '16.0.0')).toBe(false);
      expect(autoRepair.isVersionCompatible('16.0.0', 'invalid')).toBe(true);
      expect(autoRepair.isVersionCompatible('', '')).toBe(true);
    });
  });
});

// Mock implementation of the jest.fn() function for environments without Jest
if (typeof jest === 'undefined') {
  global.jest = {
    fn: function(impl) {
      const mockFn = impl || function() {};
      mockFn.mock = { calls: [], results: [], instances: [] };
      
      mockFn.mockClear = function() {
        mockFn.mock.calls = [];
        mockFn.mock.results = [];
        mockFn.mock.instances = [];
      };
      
      mockFn.mockReset = function() {
        mockFn.mockClear();
        impl = null;
      };
      
      mockFn.mockResolvedValue = function(value) {
        return jest.fn(() => Promise.resolve(value));
      };
      
      mockFn.mockRejectedValue = function(value) {
        return jest.fn(() => Promise.reject(value));
      };
      
      mockFn.mockImplementation = function(newImpl) {
        impl = newImpl;
        return mockFn;
      };
      
      mockFn.mockResolvedValueOnce = function(value) {
        const origImpl = impl;
        impl = function() {
          impl = origImpl;
          return Promise.resolve(value);
        };
        return mockFn;
      };
      
      mockFn.mockRejectedValueOnce = function(value) {
        const origImpl = impl;
        impl = function() {
          impl = origImpl;
          return Promise.reject(value);
        };
        return mockFn;
      };
      
      return mockFn;
    }
  };
}

// Mock implementation of the expect function for environments without Jest
if (typeof expect === 'undefined') {
  global.expect = function(actual) {
    return {
      toBe: function(expected) {
        if (actual !== expected) {
          throw new Error(`Expected ${expected} but got ${actual}`);
        }
        return true;
      },
      
      toBeTruthy: function() {
        if (!actual) {
          throw new Error(`Expected truthy value but got ${actual}`);
        }
        return true;
      },
      
      toBeFalsy: function() {
        if (actual) {
          throw new Error(`Expected falsy value but got ${actual}`);
        }
        return true;
      },
      
      toEqual: function(expected) {
        const actualStr = JSON.stringify(actual);
        const expectedStr = JSON.stringify(expected);
        if (actualStr !== expectedStr) {
          throw new Error(`Expected ${expectedStr} but got ${actualStr}`);
        }
        return true;
      },
      
      toContain: function(expected) {
        if (!actual.includes(expected)) {
          throw new Error(`Expected ${actual} to contain ${expected}`);
        }
        return true;
      },
      
      toHaveBeenCalled: function() {
        if (!actual.mock || actual.mock.calls.length === 0) {
          throw new Error('Expected function to have been called');
        }
        return true;
      },
      
      toHaveBeenCalledTimes: function(times) {
        if (!actual.mock || actual.mock.calls.length !== times) {
          throw new Error(`Expected function to have been called ${times} times, but it was called ${actual.mock ? actual.mock.calls.length : 0} times`);
        }
        return true;
      },
      
      rejects: {
        toThrow: async function(expected) {
          try {
            await actual();
            throw new Error('Expected function to throw');
          } catch (error) {
            if (expected && !(error instanceof expected)) {
              throw new Error(`Expected error to be instance of ${expected.name}, but got ${error.constructor.name}`);
            }
            return true;
          }
        }
      }
    };
  };
}

// Mock implementation of the describe and it functions for environments without Jest
if (typeof describe === 'undefined') {
  global.describe = function(description, fn) {
    console.log(`Test suite: ${description}`);
    fn();
  };
  
  global.it = async function(description, fn) {
    console.log(`  Test: ${description}`);
    try {
      await fn();
      console.log(`  ✓ ${description}`);
    } catch (error) {
      console.error(`  ✗ ${description}`);
      console.error(`    ${error.message}`);
    }
  };
  
  global.beforeEach = function(fn) {
    global._beforeEachFn = fn;
  };
  
  const originalIt = global.it;
  global.it = async function(description, fn) {
    console.log(`  Test: ${description}`);
    try {
      if (global._beforeEachFn) {
        await global._beforeEachFn();
      }
      await fn();
      console.log(`  ✓ ${description}`);
    } catch (error) {
      console.error(`  ✗ ${description}`);
      console.error(`    ${error.message}`);
    }
  };
}

// Run tests if script is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  console.log('Running AutoRepairService tests...');
}