/**
 * Performance Monitor
 * 
 * Utility for monitoring and optimizing application performance.
 * Tracks metrics like load time, memory usage, and interaction times.
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      loadTime: 0,
      interactionTimes: {},
      apiCalls: {},
      memoryUsage: {},
      longTasks: []
    };
    
    this.startTime = null;
    this.isMonitoring = false;
    this.longTaskThreshold = 50; // ms
    this.apiTimeouts = {}; // Store API call timeouts
    
    // Observer for long tasks
    this.observer = null;
  }
  
  /**
   * Initialize the performance monitor
   */
  init() {
    this.startTime = performance.now();
    this.isMonitoring = true;
    
    // Measure initial load time
    window.addEventListener('load', this.measureLoadTime.bind(this));
    
    // Set up PerformanceObserver for long tasks if supported
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        this.observer = new PerformanceObserver(this.handleLongTasks.bind(this));
        this.observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        console.warn('PerformanceObserver for longtask not supported', e);
      }
    }
    
    // Monitor memory usage if supported
    this.monitorMemoryUsage();
    
    // Set up interval for regular memory checks
    this.memoryInterval = setInterval(() => {
      this.monitorMemoryUsage();
    }, 30000); // Check every 30 seconds
    
    console.log('Performance monitoring initialized');
    return this;
  }
  
  /**
   * Stop performance monitoring
   */
  stop() {
    this.isMonitoring = false;
    
    // Clean up listeners
    window.removeEventListener('load', this.measureLoadTime.bind(this));
    
    // Stop the observer
    if (this.observer) {
      this.observer.disconnect();
    }
    
    // Clear memory monitoring interval
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
    }
    
    // Clear any API timeouts
    Object.values(this.apiTimeouts).forEach(timeout => {
      clearTimeout(timeout);
    });
    
    console.log('Performance monitoring stopped');
    return this;
  }
  
  /**
   * Measure page load time
   */
  measureLoadTime() {
    if (!this.isMonitoring) return;
    
    const loadTime = performance.now() - this.startTime;
    this.metrics.loadTime = loadTime;
    
    console.log(`Page loaded in ${loadTime.toFixed(2)}ms`);
    return loadTime;
  }
  
  /**
   * Handle detection of long tasks
   * @param {PerformanceObserverEntryList} entryList - List of performance entries
   */
  handleLongTasks(entryList) {
    if (!this.isMonitoring) return;
    
    const entries = entryList.getEntries();
    
    entries.forEach(entry => {
      // Only track tasks that exceed our threshold
      if (entry.duration > this.longTaskThreshold) {
        this.metrics.longTasks.push({
          duration: entry.duration,
          startTime: entry.startTime,
          timestamp: new Date().toISOString()
        });
        
        console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`);
      }
    });
  }
  
  /**
   * Monitor memory usage if the API is available
   */
  monitorMemoryUsage() {
    if (!this.isMonitoring) return;
    
    // Check if the memory API is available
    if (performance.memory) {
      const memory = performance.memory;
      this.metrics.memoryUsage = {
        totalJSHeapSize: memory.totalJSHeapSize,
        usedJSHeapSize: memory.usedJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        timestamp: new Date().toISOString()
      };
      
      // Check if memory usage is approaching the limit
      const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      if (usageRatio > 0.8) {
        console.warn(`High memory usage detected: ${(usageRatio * 100).toFixed(2)}% of limit`);
      }
    }
  }
  
  /**
   * Track the start of a user interaction
   * @param {string} interactionName - Name of the interaction to track
   */
  trackInteractionStart(interactionName) {
    if (!this.isMonitoring) return;
    
    if (!this.metrics.interactionTimes[interactionName]) {
      this.metrics.interactionTimes[interactionName] = [];
    }
    
    this.metrics.interactionTimes[interactionName].push({
      startTime: performance.now(),
      endTime: null,
      duration: null
    });
    
    return this;
  }
  
  /**
   * Track the end of a user interaction
   * @param {string} interactionName - Name of the interaction to track
   */
  trackInteractionEnd(interactionName) {
    if (!this.isMonitoring || !this.metrics.interactionTimes[interactionName]) return;
    
    const interactions = this.metrics.interactionTimes[interactionName];
    const currentInteraction = interactions[interactions.length - 1];
    
    if (currentInteraction && currentInteraction.startTime && !currentInteraction.endTime) {
      const endTime = performance.now();
      const duration = endTime - currentInteraction.startTime;
      
      currentInteraction.endTime = endTime;
      currentInteraction.duration = duration;
      
      // Log slow interactions
      if (duration > 300) { // 300ms threshold for "slow" interactions
        console.warn(`Slow interaction detected: ${interactionName} took ${duration.toFixed(2)}ms`);
      }
    }
    
    return this;
  }
  
  /**
   * Track API call performance
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   */
  trackApiCall(endpoint, method = 'GET') {
    if (!this.isMonitoring) return { end: () => {} };
    
    const key = `${method}:${endpoint}`;
    if (!this.metrics.apiCalls[key]) {
      this.metrics.apiCalls[key] = [];
    }
    
    const startTime = performance.now();
    
    // Set a timeout to detect slow API calls
    const timeoutId = setTimeout(() => {
      console.warn(`Slow API call detected: ${key} is taking over 3000ms`);
    }, 3000);
    
    this.apiTimeouts[key] = timeoutId;
    
    return {
      end: (status) => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Clear the timeout
        clearTimeout(this.apiTimeouts[key]);
        delete this.apiTimeouts[key];
        
        this.metrics.apiCalls[key].push({
          startTime,
          endTime,
          duration,
          status,
          timestamp: new Date().toISOString()
        });
        
        // Log slow successful API calls
        if (status >= 200 && status < 300 && duration > 1000) {
          console.warn(`Slow successful API call: ${key} took ${duration.toFixed(2)}ms`);
        } 
        // Log all failed API calls
        else if (status >= 400) {
          console.error(`Failed API call: ${key} returned status ${status} in ${duration.toFixed(2)}ms`);
        }
        
        return duration;
      }
    };
  }
  
  /**
   * Get current performance metrics
   * @returns {Object} Current metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }
  
  /**
   * Reset performance metrics
   */
  resetMetrics() {
    this.metrics = {
      loadTime: 0,
      interactionTimes: {},
      apiCalls: {},
      memoryUsage: {},
      longTasks: []
    };
    
    return this;
  }
  
  /**
   * Get a performance report
   * @returns {Object} Performance report
   */
  getReport() {
    const report = {
      loadTime: this.metrics.loadTime,
      interactionSummary: this.summarizeInteractions(),
      apiCallSummary: this.summarizeApiCalls(),
      memoryUsage: this.metrics.memoryUsage,
      longTaskCount: this.metrics.longTasks.length,
      timestamp: new Date().toISOString()
    };
    
    return report;
  }
  
  /**
   * Summarize interaction times
   * @returns {Object} Interaction summary
   */
  summarizeInteractions() {
    const summary = {};
    
    Object.keys(this.metrics.interactionTimes).forEach(key => {
      const interactions = this.metrics.interactionTimes[key].filter(i => i.duration !== null);
      
      if (interactions.length > 0) {
        const durations = interactions.map(i => i.duration);
        const total = durations.reduce((sum, duration) => sum + duration, 0);
        
        summary[key] = {
          count: interactions.length,
          averageDuration: total / interactions.length,
          minDuration: Math.min(...durations),
          maxDuration: Math.max(...durations)
        };
      }
    });
    
    return summary;
  }
  
  /**
   * Summarize API calls
   * @returns {Object} API call summary
   */
  summarizeApiCalls() {
    const summary = {};
    
    Object.keys(this.metrics.apiCalls).forEach(key => {
      const calls = this.metrics.apiCalls[key];
      
      if (calls.length > 0) {
        const durations = calls.map(c => c.duration);
        const total = durations.reduce((sum, duration) => sum + duration, 0);
        const failedCalls = calls.filter(c => c.status >= 400).length;
        
        summary[key] = {
          count: calls.length,
          averageDuration: total / calls.length,
          minDuration: Math.min(...durations),
          maxDuration: Math.max(...durations),
          failureRate: failedCalls / calls.length
        };
      }
    });
    
    return summary;
  }
}

// Create singleton instance
const instance = new PerformanceMonitor();

export default instance;