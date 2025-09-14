// Import polyfills first
import "./utils/nodePolyfills";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Set theme based on user preference
const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
const setThemeClass = (isDarkMode: boolean) => {
  document.documentElement.classList.toggle("dark-theme", isDarkMode);
  document.documentElement.classList.toggle("light-theme", !isDarkMode);
};

// Set initial theme
setThemeClass(darkModeMediaQuery.matches);

// Listen for changes
darkModeMediaQuery.addEventListener("change", (e) => {
  setThemeClass(e.matches);
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
