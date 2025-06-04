import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, CreateUserRequest, AuthTokens, JwtPayload } from '../types';
import { query } from '../database/connection';

export class AuthService {
  private static readonly BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
  private static readonly JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
  private static readonly JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '30d';

  static async createUser(userData: CreateUserRequest): Promise<User> {
    const { email, username, password } = userData;

    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1 OR username = $2', [
      email,
      username,
    ]);

    if (existingUser.rows.length > 0) {
      throw new Error('User with this email or username already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, this.BCRYPT_ROUNDS);

    // Insert user
    const result = await query(
      `INSERT INTO users (email, username, password_hash) 
       VALUES ($1, $2, $3) 
       RETURNING id, email, username, created_at, updated_at, is_active`,
      [email, username, passwordHash]
    );

    return result.rows[0];
  }

  static async authenticateUser(email: string, password: string): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE email = $1 AND is_active = true', [
      email,
    ]);

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    return isValidPassword ? user : null;
  }

  static async generateTokens(user: User): Promise<AuthTokens> {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };

    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRE,
    });

    const refreshToken = jwt.sign({ userId: user.id }, this.JWT_SECRET, {
      expiresIn: this.JWT_REFRESH_EXPIRE,
    });

    // Store refresh token hash in database
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshTokenHash, expiresAt]
    );

    const decoded = jwt.decode(accessToken) as JwtPayload;

    return {
      accessToken,
      refreshToken,
      expiresIn: decoded.exp - decoded.iat,
    };
  }

  static async validateToken(token: string): Promise<JwtPayload | null> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as JwtPayload;

      // Check if user still exists and is active
      const result = await query('SELECT id FROM users WHERE id = $1 AND is_active = true', [
        decoded.userId,
      ]);

      return result.rows.length > 0 ? decoded : null;
    } catch (error) {
      return null;
    }
  }

  static async getUserById(userId: string): Promise<User | null> {
    const result = await query(
      'SELECT id, email, username, created_at, updated_at, is_active FROM users WHERE id = $1',
      [userId]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }
}
