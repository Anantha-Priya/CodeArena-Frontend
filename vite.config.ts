import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Backend CORS is locked to exactly localhost:5173 / 127.0.0.1:5173 — fail loudly
    // instead of silently starting on another port if 5173 is already taken.
    strictPort: true,
  },
})
