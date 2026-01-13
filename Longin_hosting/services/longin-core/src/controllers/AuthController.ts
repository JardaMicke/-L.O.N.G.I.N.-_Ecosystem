import { Request, Response } from 'express';
import { AuthService, RegisterSchema, LoginSchema, ChangePasswordSchema } from '../services/AuthService';
import { ZodError } from 'zod';

// Extend Request interface to include user from auth middleware
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  changePassword = async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const validatedData = ChangePasswordSchema.parse(req.body);
      const result = await this.authService.changePassword(authReq.user.userId, validatedData);
      res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: 'Validation Error', details: error.errors });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  };

  register = async (req: Request, res: Response) => {
    try {
      const validatedData = RegisterSchema.parse(req.body);
      const result = await this.authService.register(validatedData);
      res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: 'Validation Error', details: error.errors });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const validatedData = LoginSchema.parse(req.body);
      const result = await this.authService.login(validatedData);
      res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: 'Validation Error', details: error.errors });
      } else {
        res.status(401).json({ error: error.message });
      }
    }
  };
}
