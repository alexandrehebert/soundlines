import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ARTIST_EDGE_COLORS, chartColor, FAMILY_COLORS, INSTRUMENT_EDGE_COLORS, LINEAGE_EDGE_COLORS, NODE_TYPE_COLORS } from './theme.ts'

const css = readFileSync(new URL('./colorTheme.css', import.meta.url), 'utf8')

function readLightTheme(): string {
  const block = css.match(/:root\[data-theme="light"\] \{([\s\S]*?)\}/)?.[1]
  if (!block) throw new Error('Missing light theme colors')
  return block
}

const lightTheme = readLightTheme()

function color(name: string): number[] {
  const value = lightTheme.match(new RegExp(`--color-${name}:\\s*#([\\da-f]{6});`, 'i'))?.[1]
  if (!value) throw new Error(`Missing light theme color: ${name}`)
  return rgb(value)
}

function chartRgb(source: string): number[] {
  const value = lightTheme.match(new RegExp(`--chart-${source.slice(1)}:\\s*#([\\da-f]{6});`, 'i'))?.[1]
  if (!value) throw new Error(`Missing light chart alias: ${source}`)
  return rgb(value)
}

function markColor(name: string): string {
  const value = css.match(new RegExp(`--soundlines-mark-light-${name}:\\s*(#[\\da-f]{6});`, 'i'))?.[1]
  if (!value) throw new Error(`Missing light brand color: ${name}`)
  return value
}

function rgb(hex: string): number[] {
  const value = hex.replace('#', '')
  return [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16))
}

function mix(foreground: number[], background: number[], amount: number): number[] {
  return foreground.map((channel, index) => channel * amount + background[index] * (1 - amount))
}

function contrast(first: number[], second: number[]): number {
  const luminance = (channels: number[]) => channels
    .map((channel) => channel / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0)
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a)
  return (lighter + 0.05) / (darker + 0.05)
}

describe('light theme menu colors', () => {
  it('keeps selected cyan and violet controls readable on their tinted backgrounds', () => {
    const surface = color('slate-900')
    const cyanBackground = mix(color('cyan-500'), surface, 0.15)
    const violetBackground = mix(color('violet-500'), surface, 0.2)

    expect(contrast(color('cyan-200'), cyanBackground)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(color('violet-200'), violetBackground)).toBeGreaterThanOrEqual(4.5)
  })

  it('keeps search result names and every type label readable, including the highlighted result', () => {
    const surface = color('slate-900')
    const highlighted = mix(color('violet-900'), surface, 0.7)
    const ink = color('slate-50')

    expect(contrast(color('slate-200'), highlighted)).toBeGreaterThanOrEqual(4.5)
    expect(css).toContain('.search-result-type { color: var(--search-result-type-color); }')
    expect(css).toContain('color-mix(in srgb, var(--search-result-type-color) 35%, var(--color-slate-50))')
    for (const typeColor of Object.values(NODE_TYPE_COLORS)) {
      const label = mix(chartRgb(typeColor), ink, 0.35)
      expect(contrast(label, surface)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(label, highlighted)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('uses readable secondary text on warm, non-white surfaces', () => {
    expect(contrast(color('slate-500'), color('slate-900'))).toBeGreaterThanOrEqual(4.5)
    expect(Math.max(...color('slate-950'))).toBeLessThan(250)
    expect(Math.max(...color('slate-900'))).toBeLessThan(250)
  })
})

describe('light theme brand mark', () => {
  it('keeps distinct waves and endpoints readable on the warm background', () => {
    const background = rgb(markColor('background'))
    const colors = ['blue', 'pink', 'endpoint'].map(markColor)
    expect(new Set(colors).size).toBe(colors.length)
    for (const value of colors) expect(contrast(rgb(value), background)).toBeGreaterThanOrEqual(4.5)
  })

  it('keeps the blue wave distinct from the rose wave', () => {
    const blue = rgb(markColor('blue'))
    const pink = rgb(markColor('pink'))
    expect(blue[2] - blue[1]).toBeGreaterThanOrEqual(25)
    expect(Math.hypot(...blue.map((channel, index) => channel - pink[index]))).toBeGreaterThanOrEqual(80)
  })

  it('applies the light palette to the header and the matching static favicon', () => {
    const favicon = readFileSync(new URL('../public/favicon-light.svg', import.meta.url), 'utf8')
    const storyCss = readFileSync(new URL('./stories/Favicon.css', import.meta.url), 'utf8')
    expect(css).toContain('[data-soundlines-mark] > circle {')
    expect(css).toContain('[data-soundlines-mark] path[stroke="#22d3ee"] { stroke: var(--soundlines-mark-light-blue); }')
    expect(css).toContain('[data-soundlines-mark] path[stroke="#f472b6"] { stroke: var(--soundlines-mark-light-pink); }')
    expect(css).toContain('[data-soundlines-mark] > svg > circle { fill: var(--soundlines-mark-light-endpoint); }')
    expect(favicon).toContain(`fill="${markColor('background')}" stroke="${markColor('border')}"`)
    expect(favicon).toContain(`stroke="${markColor('blue')}"`)
    expect(favicon).toContain(`stroke="${markColor('pink')}"`)
    expect(favicon).toContain(`fill="${markColor('endpoint')}"`)
    for (const name of ['background', 'border', 'blue', 'pink', 'endpoint']) {
      expect(storyCss).toContain(`var(--soundlines-mark-light-${name})`)
    }
  })
})

describe('light chart palette', () => {
  const sourceColors = [...new Set([
    ...Object.values(FAMILY_COLORS), ...Object.values(NODE_TYPE_COLORS),
    ...Object.values(LINEAGE_EDGE_COLORS), ...Object.values(ARTIST_EDGE_COLORS),
    ...Object.values(INSTRUMENT_EDGE_COLORS),
  ])]

  it('gives every node type its own color and light alias', () => {
    const colors = Object.values(NODE_TYPE_COLORS)
    expect(new Set(colors).size).toBe(colors.length)
    expect(new Set(colors.map((source) => chartRgb(source).join())).size).toBe(colors.length)
  })

  it.each(sourceColors)('provides a restrained shared alias for %s while preserving the dark fallback', (source) => {
    const channels = chartRgb(source).map((channel) => channel / 255)
    const high = Math.max(...channels)
    const low = Math.min(...channels)
    const saturation = (high - low) / (1 - Math.abs(high + low - 1))
    expect(saturation).toBeLessThan(0.38)
    expect(chartColor(source)).toBe(`var(--chart-${source.slice(1)}, ${source})`)
  })

  it.each(sourceColors)('keeps ink readable over selected and peak-intensity %s bars and bubble centers', (source) => {
    const ink = color('slate-50')
    const hue = chartRgb(source)
    for (const opacity of [0.32, 0.55, 0.95]) {
      expect(contrast(ink, mix(hue, color('slate-950'), opacity))).toBeGreaterThanOrEqual(4.5)
    }
    const peak = mix(mix(rgb('#ffffff'), hue, 0.21), color('slate-950'), 0.84)
    expect(contrast(ink, peak)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(ink, mix(hue, color('slate-900'), 0.95))).toBeGreaterThanOrEqual(4.5)
    expect(contrast(mix(hue, ink, 0.35), color('slate-900'))).toBeGreaterThanOrEqual(4.5)
  })
})
