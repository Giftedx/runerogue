/**
 * OSRS Data API Server
 * Express.js server providing OSRS data endpoints
 *
 * @author agent/osrs-data (The Lorekeeper)
 */

import express, { type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";

const app = express();
const PORT = process.env.PORT ?? 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    package: "@runerogue/osrs-data",
    timestamp: new Date().toISOString(),
    note: "API endpoints not yet implemented - agent/osrs-data task pending",
  });
});

// TODO: Implement OSRS data endpoints
// app.get('/api/combat/max-hit', ...);
// app.get('/api/combat/accuracy', ...);
// app.get('/api/enemies/:id', ...);
// app.get('/api/formulas/validate', ...);

/**
 * Start the OSRS data API server
 */
export function startServer(): void {
  app.listen(PORT, () => {
    console.info(`OSRS Data API server running on port ${PORT}`);
    console.info(`Health check: http://localhost:${PORT}/health`);
  });
}

export { app };
