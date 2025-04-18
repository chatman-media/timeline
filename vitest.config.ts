import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    browser: {
      name: 'chrome',
      enabled: false,
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
}) 