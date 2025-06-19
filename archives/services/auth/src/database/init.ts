import { query } from "./connection";

export const initializeDatabase = async (): Promise<void> => {
  console.log("[DB Init] Starting initializeDatabase...");
  try {
    // Create users table if not exists
    console.log("[DB Init] Attempting to create users table...");
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      );
    `);
    console.log("[DB Init] Users table query executed.");

    // Create indexes
    console.log("[DB Init] Attempting to create indexes for users table...");
    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `);
    console.log("[DB Init] User indexes query executed.");

    // Create refresh tokens table
    console.log("[DB Init] Attempting to create refresh_tokens table...");
    await query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        is_revoked BOOLEAN DEFAULT false
      );
    `);
    console.log("[DB Init] Refresh_tokens table query executed.");

    console.log(
      "[DB Init] Attempting to create indexes for refresh_tokens table...",
    );
    await query(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
    `);

    console.log("[DB Init] Refresh_tokens indexes query executed.");
    console.log("[DB Init] Database initialized successfully");
  } catch (error) {
    console.error("[DB Init] Error initializing database:", error);
    throw error;
  }
};
