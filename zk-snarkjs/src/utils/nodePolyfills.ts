// This file ensures polyfills are properly loaded
import { Buffer } from "buffer";

// Make Buffer available globally
if (typeof window !== "undefined") {
  window.Buffer = window.Buffer || Buffer;

  // Polyfill for process
  if (!window.process) {
    window.process = {} as any;
  }

  // Ensure process.env exists
  if (!window.process.env) {
    window.process.env = {};
  }

  // Polyfill for process.nextTick
  if (!window.process.nextTick) {
    window.process.nextTick = setTimeout;
  }
}

export {};
