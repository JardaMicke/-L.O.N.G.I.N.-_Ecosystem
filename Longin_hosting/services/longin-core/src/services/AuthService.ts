import { AppDataSource } from '../config/database';
import { User } from '../entities/User.entity';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { z } from 'zod';

// Zod schemas for validation
export const RegisterSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  async changePassword(userId: string, data: z.infer<typeof ChangePasswordSchema>) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await bcrypt.compare(data.currentPassword, user.password_hash);

    if (!isPasswordValid) {
      throw new Error('Invalid current password');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.newPassword, salt);

    user.password_hash = passwordHash;
    await this.userRepository.save(user);

    return { message: 'Password updated successfully' };
  }

  async register(data: z.infer<typeof RegisterSchema>) {
    // Check if user exists
    const existingUser = await this.userRepository.findOne({
      where: [{ email: data.email }, { username: data.username }],
    });

    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    // Create user
    const user = this.userRepository.create({
      username: data.username,
      email: data.email,
      password_hash: passwordHash,
      role: 'user', // Default role
      is_active: true,
    });

    await this.userRepository.save(user);

    // Generate tokens
    const tokens = this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(data: z.infer<typeof LoginSchema>) {
    const user = await this.userRepository.findOne({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password_hash);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    user.last_login = new Date();
    await this.userRepository.save(user);

    const tokens = this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  private generateTokens(user: User) {
    const payload = {
      userId: user.id,
      role: user.role,
    };

    const accessToken = jwt.sign(
      payload,
      process.env.JWT_ACCESS_SECRET || 'default_secret',
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: User) {
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
