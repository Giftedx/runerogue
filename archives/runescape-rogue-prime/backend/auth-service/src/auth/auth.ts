// src/auth/auth.ts

import { User } from "./models";
// In a real application, you would import bcryptjs for password hashing
// import bcrypt from 'bcryptjs';

/**
 * Placeholder for authentication logic.
 * This will include functions for user registration, login, and token generation.
 */

// Mock user storage
const users: Map<string, User> = new Map();

export class AuthService {
  /**
   * Registers a new user.
   * @param username The user's chosen username.
   * @param email The user's email address.
   * @param password The user's plain-text password.
   * @returns The newly created user, or null if registration fails (e.g., username/email taken).
   */
  public async register(
    username: string,
    email: string,
    password: string,
  ): Promise<User | null> {
    // In a real app, check if username or email already exists in DB
    if (
      Array.from(users.values()).some(
        (u) => u.username === username || u.email === email,
      )
    ) {
      console.warn(
        `Registration failed: Username or email already exists for ${username}/${email}`,
      );
      return null;
    }

    // Hash the password (using bcryptjs in a real app)
    // const passwordHash = await bcrypt.hash(password, 10);
    const passwordHash = `hashed_${password}`; // Mock hash

    const newUser: User = {
      id: `user_${users.size + 1}`,
      username,
      email,
      passwordHash,
      createdAt: new Date(),
      lastLogin: new Date(),
    };
    users.set(newUser.id, newUser);
    console.log(`User registered: ${username}`);
    return newUser;
  }

  /**
   * Authenticates a user.
   * @param username The user's username.
   * @param password The user's plain-text password.
   * @returns The authenticated user, or null if authentication fails.
   */
  public async login(username: string, password: string): Promise<User | null> {
    const user = Array.from(users.values()).find(
      (u) => u.username === username,
    );
    if (!user) {
      console.warn(`Login failed: User ${username} not found.`);
      return null;
    }

    // Compare password (using bcryptjs.compare in a real app)
    // const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    const isPasswordValid = user.passwordHash === `hashed_${password}`; // Mock comparison

    if (!isPasswordValid) {
      console.warn(`Login failed: Invalid password for ${username}.`);
      return null;
    }

    user.lastLogin = new Date();
    console.log(`User logged in: ${username}`);
    // In a real app, generate and return a JWT token here
    return user;
  }

  /**
   * Placeholder for JWT token generation and validation.
   * This would typically involve `jsonwebtoken` library.
   */
  public generateToken(user: User): string {
    // return jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return `mock_jwt_token_for_${user.id}`; // Mock token
  }

  public validateToken(
    token: string,
  ): { userId: string; username: string } | null {
    // try { return jwt.verify(token, process.env.JWT_SECRET); } catch (e) { return null; }
    if (token.startsWith("mock_jwt_token_for_")) {
      const userId = token.replace("mock_jwt_token_for_", "");
      const user = users.get(userId);
      if (user) return { userId: user.id, username: user.username };
    }
    return null;
  }
}

export const authService = new AuthService();
