import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { z } from 'zod/v4'
import { toolDefinitions } from '../src/mcp/tools.ts'
import { PROJECT_SITE_URL } from '../src/projectLinks.ts'
import { siteStats } from './scripts/stats.ts'
import { wavPeaks } from './scripts/waveform.ts'
import { changelogSummary } from './scripts/changelog.ts'

const root = fileURLToPath(new URL('.', import.meta.url))

// GitHub Pages serves the project under its repository path, e.g. /soundlines/.
export const base = `${new URL(PROJECT_SITE_URL).pathname.replace(/\/$/, '')}/`

export default defineConfig({
  root,
  base,
  publicDir: false,
  plugins: [react(), tailwindcss()],
  // Figures quoted in the copy; only these numbers reach the bundle, not the graph itself.
  define: {
    __CHANGELOG__: JSON.stringify(changelogSummary()),
    __MCP_TOOLS__: JSON.stringify(Object.entries(toolDefinitions).map(([name, { description, inputSchema }]) => ({
      name,
      description,
      inputSchema: z.toJSONSchema(inputSchema, { io: 'input' }),
    }))),
    __SITE_STATS__: JSON.stringify(siteStats()),
    __LOOP_PEAKS__: JSON.stringify(wavPeaks(fileURLToPath(new URL('../public/loops/turntable-hip-hop.wav', import.meta.url)))),
  },
  build: {
    outDir: fileURLToPath(new URL('../_site', import.meta.url)),
    emptyOutDir: true,
    // Shared SVGs are cached once as files instead of being inlined into every page.
    assetsInlineLimit: 0,
  },
})
