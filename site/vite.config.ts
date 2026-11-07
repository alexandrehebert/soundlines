import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { PROJECT_SITE_URL } from '../src/projectLinks.ts'

const root = fileURLToPath(new URL('.', import.meta.url))

// GitHub Pages serves the project under its repository path, e.g. /soundlines/.
export const base = `${new URL(PROJECT_SITE_URL).pathname.replace(/\/$/, '')}/`

export default defineConfig({
  root,
  base,
  publicDir: false,
  plugins: [react(), tailwindcss()],
  build: {
    outDir: fileURLToPath(new URL('../_site', import.meta.url)),
    emptyOutDir: true,
    // Shared SVGs are cached once as files instead of being inlined into every page.
    assetsInlineLimit: 0,
  },
})
