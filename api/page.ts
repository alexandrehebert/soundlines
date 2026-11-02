import { readFile } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { join } from 'node:path'
import rawGraph from '../src/data/graph.json' with { type: 'json' }
import { buildIndex } from '../src/graph/graph.ts'
import type { MusicGraph } from '../src/graph/types.ts'
import { sendSocialPage } from '../server/socialPage.ts'

const { nodeById } = buildIndex(rawGraph as MusicGraph)

export default async function page(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const html = await readFile(join(process.cwd(), 'dist/index.html'), 'utf8')
  sendSocialPage(request, response, html, nodeById)
}
