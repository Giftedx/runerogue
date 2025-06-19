import dotenv from "dotenv";
import { Pool } from "pg";

console.log("[ConnectionTS - Restoring Real Connection] File loaded.");

dotenv.config(); // Load environment variables

console.log(
  "[ConnectionTS - Restoring Real Connection] dotenv.config() called.",
);
// It's good to log one environment variable to confirm .env is being read,
// but be careful not to log sensitive ones like DB_PASSWORD in real scenarios.
// For local debugging, checking if DB_USER is loaded can be helpful.
console.log(
  `[ConnectionTS - Restoring Real Connection] DB_USER from env: ${process.env.DB_USER ? "loaded" : "NOT loaded"}`,
);

let poolInstance: Pool;

try {
  poolInstance = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    // Adding some timeouts, good practice for real connections
    connectionTimeoutMillis: 5000, // Wait 5 seconds for a connection
    idleTimeoutMillis: 10000, // Close idle clients after 10 seconds
  });
  console.log(
    "[ConnectionTS - Restoring Real Connection] New Pool instance created.",
  );

  poolInstance.on("connect", (client) => {
    console.log(
      "[ConnectionTS - Restoring Real Connection] Pool: Client connected.",
    );
    // You could log client.processID here for more details if needed
  });

  poolInstance.on("error", (err, client) => {
    console.error(
      "[ConnectionTS - Restoring Real Connection] Pool: Idle client error:",
      err.message,
      err.stack,
    );
    // It's important to handle errors here, e.g., by removing the client from the pool or exiting.
  });
} catch (error) {
  console.error(
    "[ConnectionTS - Restoring Real Connection] FATAL: Error creating Pool instance:",
    error,
  );
  // If the pool cannot be created, subsequent operations will fail.
  // Depending on the application's strategy, you might rethrow, exit, or use a fallback.
  // For this test, we'll let it throw so it's obvious if .env isn't set up.
  throw error;
}

export const query = (text: string, params?: any[]) => {
  console.log(
    `[ConnectionTS - Restoring Real Connection] query function called with text: ${text.substring(0, 50)}...`,
  );
  if (!poolInstance) {
    console.error(
      "[ConnectionTS - Restoring Real Connection] Pool is not initialized!",
    );
    throw new Error(
      "Database pool not initialized. This should not happen if initial setup was successful.",
    );
  }
  return poolInstance.query(text, params);
};

// Export the pool instance for direct use if needed (e.g., for init scripts or direct management)
export default poolInstance!; // Using '!' assumes poolInstance will be defined or an error thrown.
// A more robust app might handle the undefined case gracefully.
