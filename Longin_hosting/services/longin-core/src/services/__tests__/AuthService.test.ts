import { AuthService } from '../AuthService';
import { User } from '../../entities/User.entity';
import { AppDataSource } from '../../config/database';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

// Mock external dependencies
jest.mock('../../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepo: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup User Repository Mock
    mockUserRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockUserRepo);

    // Initialize Service
    authService = new AuthService();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      // Mock findOne to return null (user doesn't exist)
      mockUserRepo.findOne.mockResolvedValue(null);

      // Mock bcrypt hash
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      // Mock create and save
      const createdUser = {
        id: 'user-id',
        ...registerData,
        password_hash: 'hashed_password',
        role: 'user',
        is_active: true,
      };
      mockUserRepo.create.mockReturnValue(createdUser);
      mockUserRepo.save.mockResolvedValue(createdUser);

      // Mock JWT
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      const result = await authService.register(registerData);

      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: [{ email: registerData.email }, { username: registerData.username }],
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerData.password, 'salt');
      expect(mockUserRepo.save).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken', 'mock-token');
      expect(result).toHaveProperty('refreshToken', 'mock-token');
      expect(result.user).not.toHaveProperty('password_hash');
    });

    it('should throw error if user already exists', async () => {
      const registerData = {
        username: 'existing',
        email: 'existing@example.com',
        password: 'password123',
      };

      mockUserRepo.findOne.mockResolvedValue({ id: 'existing-id' });

      await expect(authService.register(registerData)).rejects.toThrow(
        'User with this email or username already exists'
      );
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = {
        id: 'user-id',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        role: 'user',
      };

      mockUserRepo.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      const result = await authService.login(loginData);

      expect(result).toHaveProperty('accessToken', 'mock-token');
      expect(result.user).not.toHaveProperty('password_hash');
    });

    it('should throw error with invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const user = {
        id: 'user-id',
        email: 'test@example.com',
        password_hash: 'hashed_password',
      };

      mockUserRepo.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginData)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error if user not found', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(authService.login(loginData)).rejects.toThrow('Invalid credentials');
    });
  });
});
