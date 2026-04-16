import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/auth': { target: 'http://localhost:8000', changeOrigin: true },
      '/files': { target: 'http://localhost:8000', changeOrigin: true },
      '/folders': { target: 'http://localhost:8000', changeOrigin: true },
      '/upload': { target: 'http://localhost:8000', changeOrigin: true },
      '/share': { target: 'http://localhost:8000', changeOrigin: true },
      '/activity': { target: 'http://localhost:8000', changeOrigin: true },
      '/media': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
})
