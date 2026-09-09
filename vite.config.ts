import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // three.js lands in its own lazy-loaded chunk (see src/ui/SceneView.tsx).
    chunkSizeWarningLimit: 1200,
  },
})
