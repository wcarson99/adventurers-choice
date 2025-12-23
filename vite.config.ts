import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/entities': path.resolve(__dirname, './src/entities'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/systems': path.resolve(__dirname, './src/systems'),
      '@/mini-games': path.resolve(__dirname, './src/mini-games'),
      '@/game-engine': path.resolve(__dirname, './src/game-engine'),
      '@/world': path.resolve(__dirname, './src/world'),
      '@/ui': path.resolve(__dirname, './src/ui'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/constants': path.resolve(__dirname, './src/constants'),
    },
  },
})

