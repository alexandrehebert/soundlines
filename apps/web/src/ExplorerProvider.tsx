'use client'

import type { ReactNode } from 'react'
import { ExplorerContext, useExplorerState } from './ExplorerContext.ts'
import type { MusicGraph } from './graph/types.ts'
import { DEFAULT_LOCALE, type Locale } from './i18n/routing.ts'

export function ExplorerProvider({
  graph,
  locale = DEFAULT_LOCALE,
  children,
}: {
  graph: MusicGraph
  locale?: Locale
  children: ReactNode
}) {
  const state = useExplorerState(graph, locale)
  return <ExplorerContext.Provider value={state}>{children}</ExplorerContext.Provider>
}
