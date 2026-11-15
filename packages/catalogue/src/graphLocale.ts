import rawFrenchGraph from '../data/graph.fr.json'
import rawGermanGraph from '../data/graph.de.json'
import rawItalianGraph from '../data/graph.it.json'
import rawSpanishGraph from '../data/graph.es.json'
import type { MusicGraph } from './types.ts'
import type { Locale } from './locales.ts'
import { englishGraph, translateGraph, type GraphTranslation, type OverlayLocale } from './translateGraph.ts'

/**
 * One `graph.<locale>.json` overlay per non-English app locale. The type makes a new locale in
 * `LOCALES` fail to compile until its overlay is registered here.
 */
export const GRAPH_OVERLAYS: Record<OverlayLocale, GraphTranslation> = {
  fr: rawFrenchGraph as GraphTranslation,
  de: rawGermanGraph as GraphTranslation,
  it: rawItalianGraph as GraphTranslation,
  es: rawSpanishGraph as GraphTranslation,
}

export function graphForLocale(locale: Locale): MusicGraph {
  return locale === 'en' ? englishGraph : translateGraph(englishGraph, GRAPH_OVERLAYS[locale])
}
