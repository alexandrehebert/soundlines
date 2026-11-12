import { z } from 'zod/v4'
import type { EdgeType, NodeType } from '../graph/types.ts'
import english from '../i18n/locales/en.json' with { type: 'json' }
import { LOCALES } from '../i18n/routing.ts'

const id = z.string().trim().min(1).max(160)
const text = z.string().trim().min(1).max(120)
const nodeType = z.enum(Object.keys(english.graphLabels.nodeTypes) as NodeType[])
const edgeTypes = z.array(z.enum(Object.keys(english.graphLabels.edges) as EdgeType[])).min(1).max(23)
const locale = z.enum(LOCALES).default('en')
const confidence = z.enum(['low', 'medium', 'high'])
const direction = z.enum(['out', 'in', 'either']).default('either')
const limit = z.number().int().min(1).max(50).default(20)
const offset = z.number().int().min(0).max(10_000).default(0)
const year = z.number().int()

const nodeFilter = z.strictObject({
  id: id.optional(),
  excludeId: id.optional(),
  type: nodeType.optional(),
  text: text.optional().describe('Substring of the name or stable ID. Case and accents are ignored.'),
  activeIn: year.optional().describe('Year within the recorded period, inclusive.'),
})

const edgeFilter = {
  types: edgeTypes.optional(),
  direction: direction.describe('Direction relative to the current node and the stored edge.'),
  confidence: confidence.optional(),
}

const step = z.strictObject({
  ...edgeFilter,
  node: nodeFilter.optional().describe('Filters for the node reached by this step.'),
})

export const toolDefinitions = {
  search_nodes: {
    description: 'Search Soundlines nodes by name or ID, optionally restricted to an entity type.',
    inputSchema: z.strictObject({ text, type: nodeType.optional(), locale, limit, offset }),
  },
  get_node: {
    description: 'Get a Soundlines entity and its recorded sources by stable ID.',
    inputSchema: z.strictObject({ id, locale }),
  },
  get_relationships: {
    description: 'List relationships and their evidence for a Soundlines entity.',
    inputSchema: z.strictObject({ id, ...edgeFilter, locale, limit, offset }),
  },
  query_graph: {
    description: 'Find nodes matching all requested branches. Each branch is an ordered path of 1–4 steps starting at the same root. Results include node and edge records with their evidence.',
    inputSchema: z.strictObject({
      root: nodeFilter,
      branches: z.array(z.array(step).min(1).max(4)).min(1).max(4),
      locale,
      limit: z.number().int().min(1).max(20).default(10),
      offset,
    }),
  },
}
