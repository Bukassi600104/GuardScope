import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  build: {
    sourcemap: false,
    rollupOptions: {
      input: {
        sidebar: 'src/sidebar/sidebar.html',
        onboarding: 'src/onboarding/onboarding.html',
      },
    },
  },
})
