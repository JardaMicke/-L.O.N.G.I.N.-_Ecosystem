import axios from 'axios';
import ApiClient from '../../utils/ApiClient';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  })),
}));

// Mock PerformanceMonitor
jest.mock('../../utils/PerformanceMonitor', () => ({
  trackApiCall: jest.fn().mockReturnValue({ 
    end: jest.fn() 
  })
}));

describe('ApiClient', () => {
  let axiosInstance;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Get the axios instance
    axiosInstance = axios.create();
  });
  
  describe('get', () => {
    it('should make a GET request', async () => {
      // Mock response
      axiosInstance.get.mockResolvedValueOnce({
        data: { id: 1, name: 'Test' }
      });
      
      // Call the api client
      const result = await ApiClient.get('/test');
      
      // Check if axios was called with correct params
      expect(axiosInstance.get).toHaveBeenCalledWith('/test', { params: {} });
      expect(result).toEqual({ id: 1, name: 'Test' });
    });
    
    it('should use cache for repeated requests', async () => {
      // Mock response
      axiosInstance.get.mockResolvedValueOnce({
        data: { id: 1, name: 'Test' }
      });
      
      // Call the api client twice with same params
      const result1 = await ApiClient.get('/test');
      const result2 = await ApiClient.get('/test');
      
      // Check if axios was called only once
      expect(axiosInstance.get).toHaveBeenCalledTimes(1);
      expect(result1).toEqual({ id: 1, name: 'Test' });
      expect(result2).toEqual({ id: 1, name: 'Test' });
    });
    
    it('should skip cache when specified', async () => {
      // Mock responses
      axiosInstance.get
        .mockResolvedValueOnce({ data: { id: 1, name: 'Test' } })
        .mockResolvedValueOnce({ data: { id: 1, name: 'Updated Test' } });
      
      // Call the api client with skipCache
      const result1 = await ApiClient.get('/test');
      const result2 = await ApiClient.get('/test', {}, { skipCache: true });
      
      // Check if axios was called twice
      expect(axiosInstance.get).toHaveBeenCalledTimes(2);
      expect(result1).toEqual({ id: 1, name: 'Test' });
      expect(result2).toEqual({ id: 1, name: 'Updated Test' });
    });
  });
  
  describe('post', () => {
    it('should make a POST request', async () => {
      // Mock response
      axiosInstance.post.mockResolvedValueOnce({
        data: { id: 1, name: 'Created' }
      });
      
      // Call the api client
      const result = await ApiClient.post('/test', { name: 'Test' });
      
      // Check if axios was called with correct params
      expect(axiosInstance.post).toHaveBeenCalledWith('/test', { name: 'Test' });
      expect(result).toEqual({ id: 1, name: 'Created' });
    });
    
    it('should invalidate cache when specified', async () => {
      // Setup cache with get request
      axiosInstance.get.mockResolvedValueOnce({
        data: { id: 1, name: 'Test' }
      });
      
      // First get to cache data
      await ApiClient.get('/test');
      
      // Mock post response
      axiosInstance.post.mockResolvedValueOnce({
        data: { success: true }
      });
      
      // Call post with cache invalidation
      await ApiClient.post('/update', { name: 'Updated' }, { invalidateCache: ['/test'] });
      
      // Mock second get response after invalidation
      axiosInstance.get.mockResolvedValueOnce({
        data: { id: 1, name: 'Updated' }
      });
      
      // Get should hit API again because cache was invalidated
      const result = await ApiClient.get('/test');
      
      expect(axiosInstance.get).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ id: 1, name: 'Updated' });
    });
  });
  
  describe('error handling', () => {
    it('should handle API errors', async () => {
      // Mock error response
      const errorResponse = { 
        response: { 
          status: 404, 
          data: { error: 'Not found' } 
        }
      };
      axiosInstance.get.mockRejectedValueOnce(errorResponse);
      
      // Spy on console error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Call the api client and expect it to reject
      await expect(ApiClient.get('/not-found')).rejects.toEqual(errorResponse);
      
      // Check if error was logged
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });
});