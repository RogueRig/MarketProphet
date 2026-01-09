import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// 🔒 Production-safe Vite config (Vercel compatible)
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  // ✅ Project root (important)
  root: path.resolve(__dirname, "client"),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },

  build: {
    // ✅ Output MUST be inside root for Vercel
    outDir: "dist",
    emptyOutDir: true,
  },

  server: {
    host: true,
  },
});