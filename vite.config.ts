import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ command }) => ({
  // GitHub Pages project site: https://brookhouser.github.io/turtle-bay/
  // Dev stays at /. `npm run build` roots assets at /turtle-bay/.
  // Firebase Hosting uses `npm run build:hosting` (vite --base /).
  base: command === 'build' ? '/turtle-bay/' : '/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 43127,
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 43127,
    strictPort: true,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}))
