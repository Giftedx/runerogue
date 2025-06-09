import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

// Environment variables type
interface ProcessEnv {
  JWT_SECRET: string;
  NODE_ENV: 'development' | 'production';
  [key: string]: string | undefined;
}

declare const process: {
  env: ProcessEnv;
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// User payload interface extending JWT payload
export interface UserPayload extends jwt.JwtPayload {
  id: string;
  username: string;
  avatar?: string;
  discriminator: string;
}

// Extend Express Request type to include user
declare module 'express-serve-static-core' {
  interface Request {
    user?: UserPayload;
  }
}

type ErrorWithStatus = Error & { status?: number };

/**
 * Generate a JWT access token for a user
 */
export const generateAccessToken = (user: Omit<UserPayload, keyof jwt.JwtPayload>): string => {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
};

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: jwt.VerifyErrors | null, decoded: unknown) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }

    if (decoded && typeof decoded === 'object') {
      req.user = decoded as UserPayload;
    }

    next();
  });
};

export const errorHandler = (
  err: Error & { status?: number },
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error for debugging
  console.error(`[${new Date().toISOString()}] Error:`, err);

  // Handle specific error types
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  // Default to 500 if no status code is set
  const statusCode = err.status || 500;

  // Don't leak stack traces in production
  const errorResponse = {
    error: {
      message: statusCode === 500 ? 'Internal Server Error' : err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  };

  res.status(statusCode).json(errorResponse);
};
