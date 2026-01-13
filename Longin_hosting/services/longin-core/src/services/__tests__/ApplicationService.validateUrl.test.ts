import { ApplicationService } from '../ApplicationService';
import { AppDataSource } from '../../config/database';
import axios from 'axios';

jest.mock('../../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

jest.mock('axios');

describe('ApplicationService - validateUrl', () => {
  let applicationService: ApplicationService;
  let mockAppRepo: any;

  beforeEach(() => {
    mockAppRepo = {
      findOne: jest.fn(),
    };
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockAppRepo);
    applicationService = new ApplicationService();
  });

  it('should return valid for a correct URL', async () => {
    const url = 'https://example.com';
    mockAppRepo.findOne.mockResolvedValue(null);
    (axios.head as jest.Mock).mockResolvedValue({ status: 200 });

    const result = await applicationService.validateUrl(url);
    expect(result.valid).toBe(true);
    expect(result.reachable).toBe(true);
  });

  it('should return invalid for incorrect format', async () => {
    const url = 'invalid-url';
    const result = await applicationService.validateUrl(url);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('Invalid URL format');
  });

  it('should return invalid if URL is taken by another app', async () => {
    const url = 'https://taken.com';
    mockAppRepo.findOne.mockResolvedValue({ id: 'other-app-id', public_url: url });

    const result = await applicationService.validateUrl(url, 'current-app-id');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('already in use');
  });

  it('should return valid if URL is taken by same app', async () => {
    const url = 'https://my-app.com';
    mockAppRepo.findOne.mockResolvedValue({ id: 'my-app-id', public_url: url });
    (axios.head as jest.Mock).mockResolvedValue({ status: 200 });

    const result = await applicationService.validateUrl(url, 'my-app-id');
    expect(result.valid).toBe(true);
  });

  it('should handle unreachable URL gracefully', async () => {
    const url = 'https://down.com';
    mockAppRepo.findOne.mockResolvedValue(null);
    (axios.head as jest.Mock).mockRejectedValue(new Error('Network Error'));

    const result = await applicationService.validateUrl(url);
    expect(result.valid).toBe(true); // Still valid format and available
    expect(result.reachable).toBe(false);
  });
});
