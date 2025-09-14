import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      buffer: "buffer",
      events: "events",
      stream: "stream-browserify",
      crypto: "crypto-browserify",
      assert: "assert",
      path: "path-browserify",
    },
  },
  define: {
    global: "window",
    "process.env": {},
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
});
