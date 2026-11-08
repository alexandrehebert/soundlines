import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import englishGraph from './graph.json'
import { GRAPH_OVERLAYS, graphForLocale, translateGraph, type GraphTranslation, type OverlayLocale } from './graphLocale.ts'
import type { MusicGraph } from '../graph/types.ts'
import { LOCALES } from '../i18n/routing.ts'

const overlayLocales = Object.keys(GRAPH_OVERLAYS) as OverlayLocale[]

function withoutTranslatedText(graph: MusicGraph): MusicGraph {
  const copy = structuredClone(graph)
  for (const node of copy.nodes) {
    node.name = ''
    delete node.description
    delete node.phaseNote
    if (node.period) delete node.period.estimateNote
    if (node.period === undefined) delete node.period
    if (node.phases === undefined) delete node.phases
    for (const phase of node.phases ?? []) delete phase.note
  }
  for (const edge of copy.edges) {
    delete edge.note
    if (edge.period) delete edge.period.estimateNote
  }
  return copy
}

describe('localized graph overlays', () => {
  it('registers exactly one graph.<locale>.json overlay per non-English app locale', () => {
    const files = readdirSync(fileURLToPath(new URL('.', import.meta.url)))
      .flatMap((file) => /^graph\.([a-z-]+)\.json$/i.exec(file)?.[1] ?? [])
      .sort()
    const expected = LOCALES.filter((locale) => locale !== 'en').sort()
    expect(files).toEqual(expected)
    expect([...overlayLocales].sort()).toEqual(expected)
  })

  it.each(overlayLocales)('keeps the graph structure and artist/track/label names unchanged in the %s overlay', (locale) => {
    const english = englishGraph as MusicGraph
    const localized = graphForLocale(locale)
    expect(withoutTranslatedText(localized)).toStrictEqual(withoutTranslatedText(english))
    for (const node of english.nodes) {
      if (node.type === 'artist' || node.type === 'track' || node.type === 'label') {
        expect(GRAPH_OVERLAYS[locale].nodes[node.id]?.name, node.id).toBeUndefined()
      }
    }
  })

  it('translates text without changing graph entities or relationships', () => {
    const english = graphForLocale('en')
    const french = graphForLocale('fr')

    expect(withoutTranslatedText(french)).toStrictEqual(withoutTranslatedText(english))
    expect(french.nodes.find((node) => node.id === 'artist:fela-kuti')).toMatchObject({
      name: 'Fela Kuti',
      description: expect.stringContaining('Compositeur, chef d’orchestre'),
    })
    expect(french.nodes.find((node) => node.id === 'event:napster-launch')?.name)
      .toBe('Napster popularise le partage de musique de pair à pair')
    expect(french.nodes.find((node) => node.id === 'genre:jazz')).toMatchObject({
      name: 'Jazz',
      description: expect.stringContaining('Musique afro-américaine'),
    })
    expect(french.nodes.find((node) => node.id === 'artist:3-steps-ahead')).toMatchObject({
      description: expect.stringContaining('néerlandais'),
      phaseNote: expect.stringContaining('3 Steps Ahead'),
    })
    expect(french.nodes.find((node) => node.id === 'artist:ahn-sook-sun')?.period?.estimateNote)
      .toContain('55 ans')
    expect(french.nodes.find((node) => node.id === 'artist:aretha-franklin')?.phases)
      .toContainEqual(expect.objectContaining({ start: 1967, note: expect.stringContaining('Atlantic') }))
    expect(french.nodes.find((node) => node.id === 'event:afm-recording-ban-start')?.name)
      .toContain('interdiction d’enregistrer')
  })

  it('translates node, phase, period, and relationship text without changing graph structure', () => {
    const graph: MusicGraph = {
      version: 1,
      nodes: [{
        id: 'genre:example',
        type: 'genre',
        name: 'Example',
        description: 'Description',
        period: { start: 1900, estimated: true, estimateNote: 'Estimate' },
        phaseNote: 'Phase summary',
        phases: [{ start: 1900, prominence: 'emerging', note: 'Phase note' }],
      }],
      edges: [{
        id: 'edge:example',
        type: 'influences',
        from: 'genre:example',
        to: 'genre:example',
        period: { start: 1900, estimateNote: 'Edge estimate' },
        note: 'Relationship note',
      }],
    }
    const translated = translateGraph(graph, {
      nodes: {
        'genre:example': {
          name: 'Exemple',
          description: 'Description française',
          estimateNote: 'Estimation',
          phaseNote: 'Résumé des phases',
          phaseNotes: { '1900': 'Note de phase' },
        },
      },
      edges: {
        'edge:example': { note: 'Note de relation', estimateNote: 'Estimation de la relation' },
      },
    })

    expect(translated.nodes[0]).toEqual({
      ...graph.nodes[0],
      name: 'Exemple',
      description: 'Description française',
      period: { start: 1900, estimated: true, estimateNote: 'Estimation' },
      phaseNote: 'Résumé des phases',
      phases: [{ start: 1900, prominence: 'emerging', note: 'Note de phase' }],
    })
    expect(translated.edges[0]).toEqual({
      ...graph.edges[0],
      period: { start: 1900, estimateNote: 'Estimation de la relation' },
      note: 'Note de relation',
    })
    expect(graph.edges[0].note).toBe('Relationship note')
    expect(graph.nodes[0].period?.estimateNote).toBe('Estimate')
    expect(graph.nodes[0].phases?.[0].note).toBe('Phase note')
  })

  it.each(overlayLocales)('covers every node descriptive text field in the %s overlay', (locale) => {
    const translations = GRAPH_OVERLAYS[locale]
    const missing: string[] = []
    for (const node of (englishGraph as MusicGraph).nodes) {
      const translation = translations.nodes[node.id]
      const requireTranslation = (value: string | undefined, field: string) => {
        if (!value?.trim()) missing.push(`${node.id}.${field}`)
      }

      if (['event', 'instrument', 'place', 'scene'].includes(node.type)) {
        requireTranslation(translation?.name, 'name')
      }
      if (node.description) requireTranslation(translation?.description, 'description')
      if (node.phaseNote) requireTranslation(translation?.phaseNote, 'phaseNote')
      if (node.period?.estimateNote) requireTranslation(translation?.estimateNote, 'estimateNote')
      for (const phase of node.phases ?? []) {
        if (phase.note) requireTranslation(translation?.phaseNotes?.[String(phase.start)], `phaseNotes.${phase.start}`)
      }
    }

    expect(missing).toEqual([])
  })

  it.each(overlayLocales)('contains translated prose without markers, entities or English chronology in %s', (locale) => {
    const translations = GRAPH_OVERLAYS[locale]
    const invalid: string[] = []
    const inspect = (value: unknown, path: string): void => {
      if (typeof value === 'string') {
        const prose = value.replace(/“[^”]*”|«[^»]*»|"[^"]*"/g, '')
        if (
          /ZXQ\d+ZX/i.test(value)
          || /&(?:amp|lt|gt|quot|apos|#(?:\d+|x[\da-f]+));/i.test(value)
          || /\b(?:(?:1[0-9]|20)\d{2}|[1-9]0)s\b/i.test(prose)
          || /\b\d{1,2}(?:st|nd|rd|th)[ -]+century\b/i.test(prose)
          || /\bClassical era\b/i.test(prose)
        ) invalid.push(path)
      } else if (value && typeof value === 'object') {
        for (const [key, child] of Object.entries(value)) {
          const childPath = `${path}.${key}`
          if (/ZXQ\d+ZX/i.test(key)) invalid.push(childPath)
          inspect(child, childPath)
        }
      }
    }
    inspect(translations, locale)
    expect(invalid).toEqual([])

    const unchanged: string[] = []
    const normalize = (text: string) => text
      .replace(/&amp;/gi, '&')
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
    const compare = (source: string | undefined, target: string | undefined, field: string) => {
      if (source && source.length > 40 && target && normalize(source) === normalize(target)) unchanged.push(field)
    }

    for (const node of (englishGraph as MusicGraph).nodes) {
      const translation = translations.nodes[node.id]
      compare(node.description, translation?.description, `${node.id}.description`)
      compare(node.phaseNote, translation?.phaseNote, `${node.id}.phaseNote`)
      compare(node.period?.estimateNote, translation?.estimateNote, `${node.id}.estimateNote`)
      for (const phase of node.phases ?? []) {
        compare(phase.note, translation?.phaseNotes?.[String(phase.start)], `${node.id}.phaseNotes.${phase.start}`)
      }
    }
    for (const edge of (englishGraph as MusicGraph).edges) {
      const translation = translations.edges[edge.id]
      compare(edge.note, translation?.note, `${edge.id}.note`)
      compare(edge.period?.estimateNote, translation?.estimateNote, `${edge.id}.estimateNote`)
    }
    expect(unchanged).toEqual([])
  })

  it('preserves the meaning of underground and low-tempo music', () => {
    const italianHouse = GRAPH_OVERLAYS.it.nodes['genre:deep-house']?.description
    const spanishHouse = GRAPH_OVERLAYS.es.nodes['genre:deep-house']?.description
    const spanishDowntempo = GRAPH_OVERLAYS.es.nodes['genre:downtempo']?.description

    expect(italianHouse).toMatch(/underground|sotterrane|indipendente/i)
    expect(italianHouse).not.toMatch(/dalla metropolitana di Chicago/i)
    expect(spanishHouse).toMatch(/underground|subterr[aá]ne|independiente/i)
    expect(spanishHouse).not.toMatch(/del metro de Chicago/i)
    expect(spanishDowntempo).toMatch(/tempo|ritmo/i)
    expect(spanishDowntempo).not.toMatch(/temperatura/i)
  })

  it('keeps genre terminology and album titles intact', () => {
    const ambient = GRAPH_OVERLAYS.de.nodes['genre:ambient']?.description
    const germanReggae = GRAPH_OVERLAYS.de.nodes['genre:reggae']?.description
    const italianReggae = GRAPH_OVERLAYS.it.nodes['genre:reggae']?.description
    const italianBlues = GRAPH_OVERLAYS.it.nodes['genre:blues']?.description

    expect(ambient).toContain('Ambient 1: Music for Airports')
    expect(ambient).not.toMatch(/\bRegenschirm\b/i)
    expect(germanReggae).toMatch(/roots reggae/i)
    expect(italianReggae).toMatch(/roots reggae/i)
    expect(italianBlues).not.toMatch(/a forma di|note azzurre/i)
  })

  it('preserves Spanish historical distinctions and recording titles', () => {
    const rumba = GRAPH_OVERLAYS.es.nodes['genre:congolese-rumba']?.phaseNote
    const techno = GRAPH_OVERLAYS.es.nodes['genre:detroit-techno']?.phaseNote
    const oneLove = GRAPH_OVERLAYS.es.nodes['track:one-love-bob-marley']?.description

    expect(rumba).toMatch(/orquest/i)
    expect(techno).not.toMatch(/afeitad/i)
    expect(oneLove).toMatch(/One Love\s*\/\s*People Get Ready/i)
    expect(oneLove).toMatch(/1965/)
    expect(oneLove).toMatch(/1977/)
  })

  it('avoids mixed-language prose and literal mistranslations in graph entries', () => {
    const spanishTuva = GRAPH_OVERLAYS.es.nodes['place:tuva']?.description
    const spanishFunk = GRAPH_OVERLAYS.es.edges['influence:funk-detroit-techno']?.note
    const spanishMahavishnu = GRAPH_OVERLAYS.es.nodes['artist:mahavishnu-orchestra']?.phaseNotes?.['1984']
    const italianRecording = GRAPH_OVERLAYS.it.nodes['track:54-46-that-s-my-number-toots-and-the-maytals']?.description
    const germanRecording = GRAPH_OVERLAYS.de.nodes['track:west-end-girls-pet-shop-boys']?.description

    expect(spanishTuva).toMatch(/rep[uú]blica/i)
    expect(spanishTuva).not.toMatch(/garganta-singing/i)
    expect(spanishFunk).not.toMatch(/\bdibuj(?:o|ó|aron)(?!\p{L})/iu)
    expect(spanishMahavishnu).toMatch(/1984/)
    expect(spanishMahavishnu).not.toMatch(/Re-formed lineup/i)
    expect(italianRecording).toMatch(/54-46 Was My Number/i)
    expect(italianRecording).not.toMatch(/\b(?:Giamaican|1968 song)\b/i)
    expect(germanRecording).toMatch(/Stephen Hague/i)
    expect(germanRecording).not.toMatch(/\bre-recorded\b/i)
  })

  it('preserves artist names in localized prose', () => {
    expect(GRAPH_OVERLAYS.it.nodes['artist:fred-again']?.description).toMatch(/Fred again\.\./i)
    expect(GRAPH_OVERLAYS.it.nodes['scene:sheffield-electronic-music-scene']?.description)
      .toMatch(/Human League/i)
    expect(GRAPH_OVERLAYS.es.nodes['artist:the-supremes']?.description).toMatch(/Supremes/i)
    expect(GRAPH_OVERLAYS.es.nodes['artist:maqbool-sabri']?.description).toMatch(/Sabri Brothers/i)
    expect(GRAPH_OVERLAYS.es.edges['anthem:your-love-chicago-house']?.note).not.toMatch(/original del Principio/i)
  })

  it('preserves unsupported-phase caveats in instrument notes', () => {
    for (const slug of ['modular-synthesizer', 'pedal-steel-guitar', 'sampler', 'sarod', 'timbales', 'tuba']) {
      const id = `instrument:${slug}`
      expect(GRAPH_OVERLAYS.it.nodes[id]?.phaseNote, id)
        .toMatch(/\b(?:non|senza|privi|prive|privo|priva|mancanza|infondat[aeio])\b/i)
    }
    for (const slug of ['maracas', 'modular-synthesizer', 'sampler', 'timbales', 'trumpet']) {
      const id = `instrument:${slug}`
      expect(GRAPH_OVERLAYS.es.nodes[id]?.phaseNote, id)
        .toMatch(/\b(?:no|sin|falt[aeo]|carece(?:n)?|carentes?|carencia|infundad[oa]s?|injustificad[oa]s?)\b/i)
    }
  })

  it('uses German performance and recording terminology for tracks', () => {
    const invalid: string[] = []
    for (const node of (englishGraph as MusicGraph).nodes) {
      if (node.type !== 'track' || !node.description) continue
      const description = GRAPH_OVERLAYS.de.nodes[node.id]?.description
      if (!description) continue
      if (/\bperformed by\b/i.test(node.description) && /durchgeführt von/i.test(description)) invalid.push(node.id)
      if (/representative recording/i.test(node.description) && /repräsentative Aufzeichnung/i.test(description)) invalid.push(node.id)
    }
    expect(invalid).toEqual([])
  })

  it.each(['de', 'it', 'es'] as const)('preserves the tech-house genre name in %s relationships', (locale) => {
    expect(GRAPH_OVERLAYS[locale].edges['lineage:tech-house-techno']?.note).toMatch(/tech[- ]house/i)
  })

  it('does not turn editorial confidence into an imperative in Spanish', () => {
    expect(GRAPH_OVERLAYS.es.edges['key:jeff-mills-techno']?.note).not.toMatch(/mant[eé]nte alto/i)
  })

  it.each(['de', 'it', 'es'] as const)('preserves song titles inside %s graph notes', (locale) => {
    expect(GRAPH_OVERLAYS[locale].nodes['genre:doo-wop']?.phaseNotes?.['1948'])
      .toMatch(/It[’']s Too Soon to Know/i)
    expect(GRAPH_OVERLAYS[locale].edges['anthem:zungguzungguguzeng-dancehall-yellowman']?.note)
      .toContain('Zungguzungguguzungguzeng')
  })

  it.each(['de', 'it', 'es'] as const)('preserves source names and identifiers marked with backticks in %s', (locale) => {
    const translations = GRAPH_OVERLAYS[locale]
    const missing: string[] = []
    const check = (source: string | undefined, target: string | undefined, field: string) => {
      if (!source || !target) return
      for (const [, token] of source.matchAll(/`([^`]+)`/g)) {
        if (!target.includes(token)) missing.push(`${field}: ${token}`)
      }
    }

    for (const node of (englishGraph as MusicGraph).nodes) {
      const translation = translations.nodes[node.id]
      check(node.description, translation?.description, `${node.id}.description`)
      check(node.phaseNote, translation?.phaseNote, `${node.id}.phaseNote`)
      check(node.period?.estimateNote, translation?.estimateNote, `${node.id}.estimateNote`)
      for (const phase of node.phases ?? []) {
        check(phase.note, translation?.phaseNotes?.[String(phase.start)], `${node.id}.phaseNotes.${phase.start}`)
      }
    }
    for (const edge of (englishGraph as MusicGraph).edges) {
      const translation = translations.edges[edge.id]
      check(edge.note, translation?.note, `${edge.id}.note`)
      check(edge.period?.estimateNote, translation?.estimateNote, `${edge.id}.estimateNote`)
    }
    expect(missing).toEqual([])
  })

  it('does not translate music scholarship as a grant in German', () => {
    expect(GRAPH_OVERLAYS.de.edges['key:lauryn-hill-conscious-hip-hop']?.note).not.toMatch(/\bStipendium\b/i)
  })

  it.each([
    ['de', /\bSingles\b/i],
    ['it', /\bi singoli\b/i],
    ['es', /\bsencillos\b/i],
  ] as const)('does not mistake “singles out” for multiple singles in %s', (locale, mistranslation) => {
    expect(GRAPH_OVERLAYS[locale].edges['anthem:archangel-dubstep-burial']?.note).not.toMatch(mistranslation)
  })

  it('does not turn a label-authored retrospective into an authorized one in Italian', () => {
    expect(GRAPH_OVERLAYS.it.edges['featured:tr-808-electro']?.note).not.toMatch(/\bautorizzat/i)
  })

  it('describes musical influence rather than drawing in Italian lineage notes', () => {
    for (const id of ['lineage:blues-hard-rock', 'lineage:grime-uk-garage']) {
      expect(GRAPH_OVERLAYS.it.edges[id]?.note, id).not.toMatch(/\bdisegn/i)
    }
  })

  it.each(['de', 'it', 'es'] as const)('localizes descriptive genre labels in %s', (locale) => {
    for (const id of [
      'genre:baroque',
      'genre:classical-period',
      'genre:khoomei',
      'genre:latin',
      'genre:medieval',
      'genre:modern-classical',
      'genre:peking-opera',
      'genre:renaissance',
      'genre:romantic',
    ]) {
      const englishName = (englishGraph as MusicGraph).nodes.find((node) => node.id === id)?.name
      const localizedName = GRAPH_OVERLAYS[locale].nodes[id]?.name
      expect(englishName, id).toBeTruthy()
      expect(localizedName?.trim(), id).toBeTruthy()
      expect(localizedName?.trim().toLowerCase(), id).not.toBe(englishName?.toLowerCase())
    }
  })

  it('uses French graph labels while preserving artist and recording names', () => {
    const french = graphForLocale('fr')
    const names = new Map(french.nodes.map((node) => [node.id, node.name]))
    expect(names.get('instrument:drum-kit')).toBe('Batterie')
    expect(names.get('instrument:french-horn')).toBe('Cor d’harmonie')
    expect(names.get('place:london')).toBe('Londres')
    expect(names.get('genre:alternative-rock')).toBe('Rock alternatif')
    for (const node of (englishGraph as MusicGraph).nodes) {
      if (node.type === 'artist' || node.type === 'track') {
        expect(names.get(node.id)).toBe(node.name)
      }
    }
  })

  it.each(overlayLocales)('covers every relationship note and period estimate in the %s overlay', (locale) => {
    const translations = GRAPH_OVERLAYS[locale]
    const missing: string[] = []
    for (const edge of (englishGraph as MusicGraph).edges) {
      const translation = translations.edges[edge.id]
      if (edge.note && !translation?.note?.trim()) missing.push(`${edge.id}.note`)
      if (edge.period?.estimateNote && !translation?.estimateNote?.trim()) {
        missing.push(`${edge.id}.estimateNote`)
      }
    }
    expect(missing).toEqual([])
  })

  it('preserves untranslated source entries and reports invalid translation ids', () => {
    const english = englishGraph as MusicGraph
    const artist = english.nodes.find((node) => node.id === 'artist:fela-kuti')
    if (!artist) throw new Error('Expected the Fela Kuti node to exist in the source graph')
    const miniGraph: MusicGraph = {
      version: 1,
      nodes: [artist],
      edges: [],
    }
    const translation: GraphTranslation = {
      nodes: { 'artist:missing': { name: 'Entrée inconnue' } },
      edges: {},
    }

    expect(() => translateGraph(miniGraph, translation))
      .toThrow('Graph translation references unknown node artist:missing')
  })

  it('rejects an edge estimate translation when the edge has no period', () => {
    const graph: MusicGraph = {
      version: 1,
      nodes: [],
      edges: [{ id: 'edge:example', type: 'influences', from: 'a', to: 'b' }],
    }

    expect(() => translateGraph(graph, {
      nodes: {},
      edges: { 'edge:example': { estimateNote: 'Estimation' } },
    })).toThrow('Estimate-note translation references edge without a period edge:example')
  })
})
