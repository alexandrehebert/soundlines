import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { isPageRequest, sendSocialPage } from './server/socialPage.ts'
import rawGraph from './src/data/graph.json' with { type: 'json' }
import { buildIndex } from './src/graph/graph.ts'
import type { MusicGraph } from './src/graph/types.ts'

const { nodeById } = buildIndex(rawGraph as MusicGraph)

function socialPages(): Plugin {
  return {
    name: 'soundlines-social-pages',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (!isPageRequest(request)) return next()
        void (async () => {
          const html = await readFile(resolve(server.config.root, 'index.html'), 'utf8')
          const transformed = await server.transformIndexHtml(request.url ?? '/', html)
          sendSocialPage(request, response, transformed, nodeById)
        })().catch(next)
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((request, response, next) => {
        if (!isPageRequest(request)) return next()
        void (async () => {
          const html = await readFile(resolve(server.config.root, server.config.build.outDir, 'index.html'), 'utf8')
          sendSocialPage(request, response, html, nodeById)
        })().catch(next)
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), socialPages()],
})
