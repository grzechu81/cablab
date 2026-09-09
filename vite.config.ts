import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => ({
  // GitHub Pages serves the project site under /<repo>/. This must match the
  // GitHub repository name exactly. The dev server stays at the root; the
  // production build and `vite preview` use the Pages path.
  base: command === 'build' || isPreview ? '/cablab/' : '/',
  plugins: [react()],
  build: {
    // three.js lands in its own lazy-loaded chunk (see src/ui/SceneView.tsx).
    chunkSizeWarningLimit: 1200,
  },
}))
