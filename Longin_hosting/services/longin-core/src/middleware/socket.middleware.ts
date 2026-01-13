import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  userId: string;
  email: string;
  role: string;
}

declare module 'socket.io' {
  interface Socket {
    user?: DecodedToken;
  }
}

export const socketAuthMiddleware = (socket: Socket, next: (err?: ExtendedError) => void) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

  if (!token) {
    return next(new Error('Authentication error: Token missing'));
  }

  try {
    const secret = process.env.JWT_ACCESS_SECRET || 'your_super_secret_access_key_change_in_production';
    const decoded = jwt.verify(token, secret) as DecodedToken;
    socket.user = decoded;
    next();
  } catch (error) {
    return next(new Error('Authentication error: Invalid token'));
  }
};
