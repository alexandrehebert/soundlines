import type { ReactNode } from 'react'
import { ExplorerContext, useExplorerState } from './ExplorerContext.ts'
import type { MusicGraph } from './graph/types.ts'

export function ExplorerProvider({ graph, children }: { graph: MusicGraph; children: ReactNode }) {
  const state = useExplorerState(graph)
  return <ExplorerContext.Provider value={state}>{children}</ExplorerContext.Provider>
}
