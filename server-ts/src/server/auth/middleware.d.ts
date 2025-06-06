import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    // Add other user properties as needed
  };
}

export interface AuthMiddleware {
  authenticate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
  isAdmin: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
}
