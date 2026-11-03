import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { labOfflineShell } from './scripts/lab-offline.js'

let commit = 'unknown'
try {
  commit = execFileSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim()
} catch {
  /* Source archives may omit Git. */
}

export default defineConfig({
  root: fileURLToPath(new URL('./lab', import.meta.url)),
  plugins: [react(), labOfflineShell()],
  publicDir: false,
  define: {
    __LAB_COMMIT__: JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA || commit),
  },
  server: { allowedHosts: ['terminal.local'] },
  build: { outDir: '../dist-lab', emptyOutDir: true },
})
