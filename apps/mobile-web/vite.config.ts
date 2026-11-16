import react from '@vitejs/plugin-react'
import graph from '@soundlines/catalogue/data/graph.json' with { type: 'json' }
import type { MusicGraph } from '@soundlines/catalogue/types'
import { mediaDirectory } from '@soundlines/media/source'
import { join } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import { cardAt, createFeed } from './src/feed.ts'

const catalogue = createFeed(graph as MusicGraph)
const initial = Array.from({ length: 12 }, (_, position) => cardAt(catalogue, position))
const feedModule = '\0virtual:mobile-catalogue'

export const mobileCataloguePlugin: Plugin = {
  name: 'soundlines-mobile-catalogue',
  resolveId(id) {
    if (id === 'virtual:mobile-catalogue') return feedModule
  },
  load(id) {
    if (id === feedModule) return `export default ${JSON.stringify(catalogue)}`
  },
  configureServer(server) {
    server.watcher.add(join(mediaDirectory, 'genre-artwork'))
  },
}

export default defineConfig({
  base: './',
  plugins: [react(), mobileCataloguePlugin],
  resolve: { alias: { '#media': mediaDirectory } },
  server: { port: 5175, strictPort: true },
  define: { __SOUNDLINES_INITIAL_FEED__: JSON.stringify(initial) },
})
