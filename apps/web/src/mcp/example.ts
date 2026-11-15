import type { z } from 'zod/v4'
import type { toolDefinitions } from './tools.ts'

export const frenchTouchQuery = {
  root: { type: 'artist' },
  branches: [
    [{ direction: 'out', types: ['key_artist_of'], node: { id: 'genre:french-touch' } }],
    [{ direction: 'out', types: ['signed_to'], node: { type: 'label' } }],
    [{ direction: 'out', types: ['key_artist_of'], node: { type: 'genre', excludeId: 'genre:french-touch' } }],
  ],
} satisfies z.input<typeof toolDefinitions.query_graph.inputSchema>
