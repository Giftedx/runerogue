import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Vite configuration for the RuneRogue phaser-client package.
 *
 * This configuration sets up a React and TypeScript project with HTTPS support
 * for local development, which is a requirement for Discord Activities.
 *
 * @see https://vitejs.dev/config/
 * @see https://discord.com/developers/docs/activities/development-process#locally-running-your-activity
 */
export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";

  // HTTPS configuration is required for the Discord Activity SDK to work locally.
  // In production, the app will be served over HTTPS by the hosting provider.
  const httpsConfig =
    isProduction ? undefined : (
      {
        key: readFileSync(resolve(__dirname, "key.pem")),
        cert: readFileSync(resolve(__dirname, "cert.pem")),
      }
    );

  return {
    plugins: [
      react({
        // Use the new JSX transform.
        jsxRuntime: "automatic",
      }),
    ],
    server: {
      port: 3000,
      https: httpsConfig,
      // Proxy API requests to the main Express server in development.
      proxy: {
        "/api": {
          target: "https://localhost:2567",
          changeOrigin: true,
          secure: false, // Allow self-signed certs
        },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: true,
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
    define: {
      // Make environment variables available in the client-side code.
      "process.env.NODE_ENV": JSON.stringify(mode),
      "process.env.VITE_DISCORD_CLIENT_ID": JSON.stringify(
        process.env.VITE_DISCORD_CLIENT_ID
      ),
    },
  };
});
