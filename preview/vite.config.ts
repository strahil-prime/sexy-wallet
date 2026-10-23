import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const root = path.resolve(__dirname, "..");

// Single-file build of the app for sharing as a static preview.
export default defineConfig({
  root: __dirname,
  css: { postcss: { plugins: [] } },
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: [
      { find: "next/link", replacement: path.resolve(__dirname, "shims/link.tsx") },
      { find: "next/image", replacement: path.resolve(__dirname, "shims/image.tsx") },
      { find: "next/navigation", replacement: path.resolve(__dirname, "shims/navigation.ts") },
      { find: /^@\//, replacement: path.join(root, "src") + "/" },
    ],
  },
  build: { outDir: path.resolve(__dirname, "dist"), emptyOutDir: true, assetsInlineLimit: 100_000_000 },
});
