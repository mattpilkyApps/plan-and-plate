import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { offlineShell } from './scripts/offline-shell.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), offlineShell()],
  server: { allowedHosts: ['terminal.local'] },
})
