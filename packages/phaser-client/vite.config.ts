import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  publicDir: "public",
  server: {
    port: 3000,
    // Enable HTTPS for Discord Activity compatibility
    https: (() => {
      try {
        return {
          key: fs.readFileSync(path.resolve(__dirname, "key.pem")),
          cert: fs.readFileSync(path.resolve(__dirname, "cert.pem")),
        };
      } catch (error) {
        console.warn(
          "HTTPS certificates not found, falling back to HTTP:",
          error.message
        );
        return undefined;
      }
    })(),
    headers: {
      // Required CSP headers for Discord Activities - Allow both HTTP and HTTPS for development
      "Content-Security-Policy": [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://discord.com https://discordapp.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' ws: wss: http: https:",
        "frame-ancestors https://discord.com https://discordapp.com https://ptb.discord.com https://canary.discord.com",
        "worker-src 'self' blob:",
      ].join("; "),
    },
    proxy: {
      "/api": {
        target: "https://localhost:2567",
        changeOrigin: true,
        secure: false,
      },
      "/.proxy/discord": {
        target: "https://discord.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/.proxy\/discord/, ""),
      },
    },
    fs: {
      // Allow serving .well-known directory
      allow: [".."],
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ["phaser"],
          react: ["react", "react-dom"],
          discord: ["@discord/embedded-app-sdk"],
          colyseus: ["colyseus.js"],
        },
      },
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "development"
    ),
  },
});
