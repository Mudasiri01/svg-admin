import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      // Proxy all /api requests to the remote Vercel auth API
      '/api': {
        target: 'https://aura-auth-api-theta.vercel.app',
        changeOrigin: true,
        secure: true,
      }
    }
  }
})
