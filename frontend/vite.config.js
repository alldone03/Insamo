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
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Group heavy 3D related libraries
            if (id.includes('three') || id.includes('@react-three')) {
              return 'vendor-3d';
            }
            // Group mapping libraries
            if (id.includes('leaflet')) {
              return 'vendor-maps';
            }
            // Group UI libraries
            if (id.includes('lucide-react') || id.includes('recharts')) {
              return 'vendor-ui';
            }
            // Other vendor libraries
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  }
})
