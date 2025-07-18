import { defineConfig } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    basicSsl()
  ],
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    https: true,
    port: 5173,
    open: true,  // Automatically open the browser on server start
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  }
})

