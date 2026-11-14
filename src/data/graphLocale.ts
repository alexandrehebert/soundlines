import rawFrenchGraph from './graph.fr.json'
import rawGermanGraph from './graph.de.json'
import rawItalianGraph from './graph.it.json'
import rawSpanishGraph from './graph.es.json'
import type { MusicGraph } from '../graph/types.ts'
import type { Locale } from '../i18n/routing.ts'
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
