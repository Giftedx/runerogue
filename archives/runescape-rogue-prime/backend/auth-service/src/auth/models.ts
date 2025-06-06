// src/auth/models.ts

/**
 * Defines the schema for a User in the authentication service.
 */
export interface User {
  id: string; // Unique user ID
  username: string;
  passwordHash: string; // Hashed password
  email: string;
  createdAt: Date;
  lastLogin: Date;
}

// Placeholder for ORM entities (e.g., TypeORM, Prisma, Sequelize)
// In a real application, these would be decorated classes or schema definitions
// that map to database tables.

export class UserEntity implements User {
  id: string;
  username: string;
  passwordHash: string;
  email: string;
  createdAt: Date;
  lastLogin: Date;

  constructor(data: User) {
    this.id = data.id;
    this.username = data.username;
    this.passwordHash = data.passwordHash;
    this.email = data.email;
    this.createdAt = data.createdAt;
    this.lastLogin = data.lastLogin;
  }
}
