import { createMcpHandler, McpServer } from '@modelcontextprotocol/server'
import { getNode, getRelationships, queryGraph, searchNodes } from './graph.ts'
import { toolDefinitions } from './tools.ts'

function result(data: Record<string, unknown>) {
  return { structuredContent: data, content: [{ type: 'text' as const, text: JSON.stringify(data) }] }
}

export const mcpHandler = createMcpHandler(() => {
  const server = new McpServer({ name: 'soundlines', version: '1.0.0' }, {
    capabilities: { tools: { listChanged: false } },
    instructions: 'Query the published Soundlines music graph. Cite the returned sources. Missing matches only indicate what is documented in this dataset.',
  })
  const annotations = { readOnlyHint: true, destructiveHint: false, openWorldHint: false }

  server.registerTool('search_nodes', { ...toolDefinitions.search_nodes, annotations }, (input) => result(searchNodes(input)))
  server.registerTool('get_node', { ...toolDefinitions.get_node, annotations }, (input) => result(getNode(input)))
  server.registerTool('get_relationships', { ...toolDefinitions.get_relationships, annotations }, (input) => result(getRelationships(input)))
  server.registerTool('query_graph', { ...toolDefinitions.query_graph, annotations }, (input) => result(queryGraph(input)))

  return server
}, { maxRequestBodySize: 32 * 1024, maxSubscriptions: 0 })
