import type { ExplorerView } from '../graph/timeline.ts'
import { catalogueFor } from './catalogue.ts'
import type { Locale } from './routing.ts'

export interface LocalizedPageMetadata {
  title: string
  description: string
}

export function pageMetadata(locale: Locale, page: ExplorerView | 'home' | 'bubbles' | 'data'): LocalizedPageMetadata {
  return catalogueFor(locale).seo[page]
}
