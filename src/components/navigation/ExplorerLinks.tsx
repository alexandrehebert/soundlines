import type { ReactNode } from 'react'
import { useExplorer } from '../../ExplorerContext.ts'
import { VIEW_PATHS, viewForNode, type ExplorerView } from '../../graph/timeline.ts'
import type { GraphNode } from '../../graph/types.ts'
import { localizePath } from '../../i18n/routing.ts'
import { follow } from './followLink.ts'

export function ViewLink({ view, className, children }: { view: ExplorerView; className: string; children: ReactNode }) {
  const { changeView, locale } = useExplorer()
  return <a className={className} href={localizePath(VIEW_PATHS[view], locale)} onClick={(event) => follow(event, () => changeView(view))}>{children}</a>
}

export function EntryLink({ node, className, children }: { node: GraphNode; className: string; children: ReactNode }) {
  const { selectNode, locale } = useExplorer()
  const params = new URLSearchParams({ focus: node.id })
  const path = VIEW_PATHS[viewForNode(node.type, 'genre')]
  return <a className={className} href={`${localizePath(path, locale)}?${params}`} onClick={(event) => follow(event, () => selectNode(node.id))}>{children}</a>
}
