import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  server: {
    https:
      (
        process.env.NODE_ENV === "development" &&
        fs.existsSync(path.resolve(__dirname, "key.pem"))
      ) ?
        {
          key: fs.readFileSync(path.resolve(__dirname, "key.pem")),
          cert: fs.readFileSync(path.resolve(__dirname, "cert.pem")),
        }
      : undefined,
    port: 5173,
    host: true,
    headers: {
      // Add CSP headers for Discord iframe
      "Content-Security-Policy":
        "default-src 'self'; frame-ancestors https://discord.com https://*.discord.com https://*.discordapp.com; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' wss://localhost:* ws://localhost:* https://discord.com https://*.discord.com;",
    },
  },
});
