import { defineConfig } from "vite";

export default defineConfig({
  // plugins: [], // Add any Vite plugins if needed later
  base: "./", // Ensures assets are loaded correctly relative to index.html
  build: {
    chunkSizeWarningLimit: 1000, // Suppress warning for larger Phaser chunks
  },
});
