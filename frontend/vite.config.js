import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    watch: {
        usePolling: true
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
          'vendor-ui': ['lucide-react', 'recharts'],
          'vendor-maps': ['leaflet', 'react-leaflet'],
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  }
})
