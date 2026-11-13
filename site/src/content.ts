import { en } from './copy/en.ts'
import { fr } from './copy/fr.ts'
import { de } from './copy/de.ts'
import { it } from './copy/it.ts'
import { mcpPage } from './copy/mcp.ts'
import { es } from './copy/es.ts'
import { changelogPage } from './copy/changelog.ts'
import { LOCALES } from '../../src/i18n/routing.ts'

export { PROJECT_SITE_URL as siteUrl, REPOSITORY_URL as repository } from '../../src/projectLinks.ts'

export const locales = LOCALES
export type Locale = (typeof locales)[number]
export const slugs = ['index', 'graph', 'artwork', 'audio', 'build', 'mcp', 'changelog'] as const
export type Slug = (typeof slugs)[number]

/** Who performs a workflow step; each actor has its own colour and symbol in the diagrams. */
export const actors = ['human', 'agent', 'model', 'script', 'test'] as const
export type Actor = (typeof actors)[number]

/** What a step hands to the next one, shown on the arrow between them. */
export const outputs = ['doc', 'decision', 'log', 'data', 'report', 'code', 'image', 'audio', 'app'] as const
export type Output = (typeof outputs)[number]

/** A small picture of what a step produces. Text-free kinds draw real files and data from the repository. */
export type Preview =
  | { kind: 'note'; title: string; lines: string[] }
  | { kind: 'page'; title: string; lines: string[] }
  | { kind: 'checks'; items: string[] }
  | { kind: 'log'; items: [status: 'ok' | 'blocked', text: string][] }
  | { kind: 'link'; from: string; to: string; type: string; confidence: string }
  | { kind: 'files'; items: string[] }
  | { kind: 'verdict'; options: string[]; chosen: number }
  | { kind: 'blueprint'; title: string; units: string; anchors: string; handles: string; description: string }
  | { kind: 'artwork' | 'codes' | 'takes' }
  | {
      kind: 'loop'
      caption: string
      takeLabel: string
      schematicLabel: string
      discardedLabel: string
      selectionLabel: string
      keptLabel: string
    }
  | { kind: 'player'; caption: string; waveformLabel: string; playerLabel: string }
  | { kind: 'screen'; shot: 'graph' | 'artwork' | 'home'; alt: string }

export type FlowStep = { actor: Actor; title: string; text: string; output: [kind: Output, label: string]; preview: Preview }

/** A return path drawn beside the line: failures found at the `from` steps send the work back to step `to` (1-based). */
export type FlowLoop = { from: number[]; to: number; label: string }

/** A workflow diagram: an ordered chain of steps, with optional loops back when a check fails. */
export type Flow = { title: string; caption: string; steps: FlowStep[]; loops?: FlowLoop[] }

/** A real, documented case shown as a fact sheet. `path` links to its record in the repository. */
export type Example = { title: string; intro: string; rows: [label: string, value: string][]; path: string; link: string }

export type Page = {
  label: string
  /** Shorter label for the page navigation, when `label` is too long to fit one row. */
  nav?: string
  eyebrow?: string
  title: string
  intro: string
  /** Index only: parallel production lines that all end in the app. */
  overview?: { title: string; intro: string; lanes: [title: string, stations: string[]][]; destination: string }
  flows: Flow[]
  sections: [title: string, text: string][]
  example?: Example
  showcase?: boolean
  /** Repository-relative path (optionally with #anchor) or absolute URL, and link text. */
  resources: [path: string, title: string][]
}

export type StatKey = keyof typeof __SITE_STATS__

export type Copy = {
  skip: string
  navigation: string
  language: string
  openApp: string
  openDataTitle: string
  openDataDescription: string
  openDataLink: string
  eyebrow: string
  source: string
  next: string
  resources: string
  footer: string
  docsNote: string
  legend: string
  produces: string
  result: string
  backTo: string
  example: string
  examples: string
  brief: string
  actors: Record<Actor, string>
  stats: [key: StatKey, label: string][]
  pages: Record<Exclude<Slug, 'mcp' | 'changelog'>, Page>
}

export const stats = __SITE_STATS__

/** Replaces `{statKey}` placeholders with the build-time project figures, formatted for the locale. */
export function fill(text: string, locale: Locale) {
  const format = new Intl.NumberFormat(locale)
  return text.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in stats ? format.format(stats[key as StatKey]) : match,
  )
}

const fillAll = <T,>(value: T, locale: Locale): T => {
  if (typeof value === 'string') return fill(value, locale) as T
  if (Array.isArray(value)) return value.map((item) => fillAll(item, locale)) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, fillAll(item, locale)])) as T
  }
  return value
}

/** Site copy with every figure placeholder already resolved. */
export type SiteCopy = Omit<Copy, 'pages'> & { pages: Record<Slug, Page> }

function localizedCopy(content: Copy, locale: Locale): SiteCopy {
  return fillAll({ ...content, pages: { ...content.pages, mcp: mcpPage(locale), changelog: changelogPage(locale) } }, locale)
}

export const copy: Record<Locale, SiteCopy> = {
  en: localizedCopy(en, 'en'),
  fr: localizedCopy(fr, 'fr'),
  de: localizedCopy(de, 'de'),
  it: localizedCopy(it, 'it'),
  es: localizedCopy(es, 'es'),
}
