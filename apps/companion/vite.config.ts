import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { PROJECT_SITE_URL } from '@soundlines/project-config'
import { publicMediaDirectory } from '@soundlines/project-config/public-media'
import { siteStats } from './scripts/stats.ts'
import { wavPeaks } from './scripts/waveform.ts'

const root = fileURLToPath(new URL('.', import.meta.url))

// GitHub Pages serves the project under its repository path, e.g. /soundlines/.
export const base = `${new URL(PROJECT_SITE_URL).pathname.replace(/\/$/, '')}/`

export default defineConfig({
  root,
  base,
  publicDir: false,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '#media': publicMediaDirectory },
  },
  // Figures shown on the companion; only these numbers reach the bundle, not the graph itself.
  define: {
    __SITE_STATS__: JSON.stringify(siteStats()),
    __LOOP_PEAKS__: JSON.stringify(wavPeaks(join(publicMediaDirectory, 'loops/turntable-hip-hop.wav'))),
  },
  build: {
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: true,
    // Shared SVGs are cached once as files instead of being inlined into every page.
    assetsInlineLimit: 0,
  },
})
