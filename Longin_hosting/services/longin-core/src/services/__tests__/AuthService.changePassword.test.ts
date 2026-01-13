import { AuthService } from '../AuthService';
import { User } from '../../entities/User.entity';
import { AppDataSource } from '../../config/database';
import * as bcrypt from 'bcryptjs';

// Mock dependencies
jest.mock('../../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn(),
}));

describe('AuthService - changePassword', () => {
  let authService: AuthService;
  let mockUserRepository: any;

  beforeEach(() => {
    mockUserRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockUserRepository);
    authService = new AuthService();
  });

  it('should change password successfully', async () => {
    const userId = 'user-123';
    const currentPassword = 'oldPassword';
    const newPassword = 'newPassword123';
    const hashedPassword = 'oldHashedPassword';

    mockUserRepository.findOne.mockResolvedValue({
      id: userId,
      password_hash: hashedPassword,
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await authService.changePassword(userId, {
      currentPassword,
      newPassword,
    });

    expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
    expect(bcrypt.compare).toHaveBeenCalledWith(currentPassword, hashedPassword);
    expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 'salt');
    expect(mockUserRepository.save).toHaveBeenCalled();
    expect(result).toEqual({ message: 'Password updated successfully' });
  });

  it('should throw error if user not found', async () => {
    mockUserRepository.findOne.mockResolvedValue(null);

    await expect(authService.changePassword('user-123', {
      currentPassword: 'any',
      newPassword: 'any',
    })).rejects.toThrow('User not found');
  });

  it('should throw error if current password is invalid', async () => {
    mockUserRepository.findOne.mockResolvedValue({
      id: 'user-123',
      password_hash: 'hash',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(authService.changePassword('user-123', {
      currentPassword: 'wrong',
      newPassword: 'new',
    })).rejects.toThrow('Invalid current password');
  });
});
