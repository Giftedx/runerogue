import { UserPayload } from './middleware';

declare module '../auth/middleware' {
  export * from './middleware';
  
  export function generateAccessToken(user: Omit<UserPayload, keyof import('jsonwebtoken').JwtPayload>): string;
  
  export function authenticateToken(
    req: import('express').Request,
    res: import('express').Response,
    next: import('express').NextFunction
  ): void;
}
