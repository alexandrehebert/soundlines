import { readFileSync } from 'node:fs'
import { Disc3 } from 'lucide-react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Comparison } from './stories/Favicon.stories.tsx'
import { BrandLink } from './components/navigation/BrandLink.tsx'
import { HOVER_CYCLES_PER_SECOND, SOUNDLINES_BACKGROUND, SOUNDLINES_ENDPOINT_COLOR, SOUNDLINES_WAVES, SoundlinesWaveMotion } from './components/navigation/soundlinesMarkMotion.ts'
import { createWaveModel, planWaveRest, sampleCubicPath, wavePathAt, wavePointsAt, WaveTape } from './components/navigation/soundlinesWave.ts'
import { faviconUrl } from './favicon.ts'

function iconShapes(markup: string) {
  return [...markup.matchAll(/<(?:circle|path)\b[^>]*>/g)]
    .map(([tag]) => tag.replace(/\s*\/?>$/, '>'))
}

describe('favicon', () => {
  it('uses a larger version of the approved resting frame without animation', () => {
    const favicon = readFileSync(new URL('../public/favicon.svg', import.meta.url), 'utf8')
    const approved = readFileSync(new URL('./stories/fixtures/favicon-concepts/soundlines.svg', import.meta.url), 'utf8')
    expect(iconShapes(favicon)).toEqual(iconShapes(approved))
    expect(favicon).toContain('width="32" height="32" viewBox="1 1 22 22"')
    expect(favicon).not.toMatch(/<(?:animate|animateTransform|script|style)\b/)
    expect(favicon).not.toMatch(/\bon\w+\s*=/)
  })

  it('preserves the previous vinyl geometry and its license in the comparison fixture', () => {
    const favicon = readFileSync(new URL('./stories/fixtures/favicon-concepts/vinyl.svg', import.meta.url), 'utf8')
    const headerIcon = renderToStaticMarkup(createElement(Disc3))
    const embeddedIcon = favicon.match(/<svg\b[^>]*viewBox="0 0 24 24"[^>]*>/)?.[0]

    expect(embeddedIcon).toBeDefined()
    expect(favicon).toContain('Disc3 icon: ISC License')
    expect(embeddedIcon).toContain('stroke="#a684ff"')
    expect(iconShapes(favicon)).toEqual(iconShapes(headerIcon))
    for (const attribute of ['viewBox', 'fill', 'stroke-width', 'stroke-linecap', 'stroke-linejoin']) {
      const pattern = new RegExp(`\\b${attribute}="([^"]+)"`)
      expect(embeddedIcon?.match(pattern)?.[1]).toBe(headerIcon.match(pattern)?.[1])
    }
  })

  it.each([
    '../.storybook/preview-head.html',
    '../.storybook/manager-head.html',
  ])('uses the cache-busted dark favicon in %s', (path) => {
    const html = readFileSync(new URL(path, import.meta.url), 'utf8')
    expect(html).toContain('favicon.svg?v=soundlines-wave')
  })

  it('uses cache-busted icons for both app themes and includes the light icon in public Storybook', () => {
    expect(faviconUrl('dark')).toBe('/favicon.svg?v=soundlines-wave')
    expect(faviconUrl('light')).toBe('/favicon-light.svg?v=soundlines-wave')
    const storybook = readFileSync(new URL('../.storybook/main.ts', import.meta.url), 'utf8')
    expect(storybook).toContain("{ from: '../public/favicon-light.svg', to: '/favicon-light.svg' }")
  })

  it('keeps the light favicon on the same still waveform frame', () => {
    const favicon = readFileSync(new URL('../public/favicon-light.svg', import.meta.url), 'utf8')
    const paths = [...favicon.matchAll(/<path\b[^>]*\bd="([^"]+)"/g)].map(([, d]) => d)
    expect(paths).toEqual(SOUNDLINES_WAVES.map(({ d }) => d))
    expect(favicon).toContain('<circle cx="3" cy="12" r="1.4"')
    expect(favicon).toContain('<circle cx="21" cy="12" r="1.4"')
    expect(favicon).not.toMatch(/<(?:animate|animateTransform|script|style)\b/)
    expect(favicon).not.toMatch(/\bon\w+\s*=/)
  })
})

describe('favicon concepts', () => {
  const monochromeConcepts = ['soundline'] as const
  const concepts = [...monochromeConcepts, 'soundlines'] as const
  const previous = readFileSync(new URL('./stories/fixtures/favicon-concepts/vinyl.svg', import.meta.url), 'utf8')
  const readConcept = (name: typeof concepts[number]) => (
    readFileSync(new URL(`./stories/fixtures/favicon-concepts/${name}.svg`, import.meta.url), 'utf8')
  )

  it.each(concepts)('keeps the existing canvas and rounded stroke style for %s', (name) => {
    const concept = readConcept(name)
    const outerSvg = /<svg\b[^>]*viewBox="0 0 32 32"[^>]*>/
    const innerSvg = /<svg\b[^>]*viewBox="0 0 24 24"[^>]*>/

    for (const pattern of [outerSvg, innerSvg]) {
      expect(previous.match(pattern)?.[0]).toBeDefined()
      expect(concept.match(pattern)?.[0]).toBe(previous.match(pattern)?.[0])
    }
    expect(iconShapes(concept).length).toBeGreaterThan(0)
  })

  it.each(monochromeConcepts)('keeps the existing tile and palette for %s', (name) => {
    const concept = readConcept(name)
    const tile = /<rect\b[^>]*\/>/
    expect(previous.match(tile)?.[0]).toBeDefined()
    expect(concept.match(tile)?.[0]).toBe(previous.match(tile)?.[0])
    const colors = [...concept.matchAll(/\b(?:fill|stroke)="([^"]+)"/g)].map(([, color]) => color)
    expect(new Set(colors)).toEqual(new Set(['#020617', '#a684ff', 'none']))
  })

  it('gives Soundlines a circular dark background with transparent corners', () => {
    const concept = readConcept('soundlines')
    expect(concept).toContain('<circle cx="16" cy="16" r="16" fill="#020617" />')
    expect(concept).not.toMatch(/<rect\b/)
  })

  it('weaves two project colors between the same endpoints', () => {
    const lines = [...readConcept('soundlines').matchAll(/<path\b[^>]*\bd="([^"]+)"[^>]*\bstroke="([^"]+)"[^>]*\/>/g)]
    expect(lines).toHaveLength(2)
    expect(new Set(lines.map(([, , color]) => color))).toEqual(new Set(['#22d3ee', '#f472b6']))
    for (const [, path] of lines) {
      expect(path).toMatch(/^M3 12 /)
      expect(path).toMatch(/ 21 12$/)
    }
    expect(lines.some(([, , color]) => color === '#a684ff')).toBe(false)
  })

  it('gives both colored lines two peaks and two troughs like Soundline', () => {
    const lines = [...readConcept('soundlines').matchAll(/<path\b[^>]*\bd="([^"]+)"[^>]*\bstroke="([^"]+)"[^>]*\/>/g)]
    expect(lines).toHaveLength(2)
    const ranges: Record<string, number> = {}
    for (const [, path, color] of lines) {
      const segments = path.split(' C').slice(1)
      expect(segments).toHaveLength(5)
      let previousY = 12
      const heights = [previousY]
      const directions = segments.map((segment) => {
        const values = segment.split(/\s+/).map(Number)
        expect(values).toHaveLength(6)
        const [, control1Y, , control2Y, , endY] = values
        expect(control1Y).toBe(previousY)
        expect(control2Y).toBe(endY)
        const direction = Math.sign(endY - previousY)
        previousY = endY
        heights.push(endY)
        return direction
      })
      expect(directions).toEqual(color === '#22d3ee' ? [-1, 1, -1, 1, -1] : [1, -1, 1, -1, 1])
      ranges[color] = Math.max(...heights) - Math.min(...heights)
    }
    expect(ranges['#f472b6']).toBeLessThan(ranges['#22d3ee'])
  })

  it('offers distinct marks', () => {
    const shapes = concepts.map((name) => iconShapes(readConcept(name)).join(''))
    expect(new Set(shapes).size).toBe(concepts.length)
  })
})

describe('favicon comparison animations', () => {
  const ids = ['vinyl', 'soundline', 'soundlines'] as const

  it('renders each favicon at every preview size with a pause control', () => {
    const markup = renderToStaticMarkup(Comparison.render())
    for (const id of ids) {
      expect(markup.match(new RegExp(`favicon-preview--${id}\\b`, 'g'))).toHaveLength(6)
    }
    for (const name of ['soundline', 'soundlines']) {
      const svg = readFileSync(new URL(`./stories/fixtures/favicon-concepts/${name}.svg`, import.meta.url), 'utf8')
      const previewSvg = svg.replace('<svg ', '<svg aria-hidden="true" focusable="false" ')
      expect(previewSvg).not.toBe(svg)
      expect(markup.split(previewSvg)).toHaveLength(7)
    }
    expect(markup).toContain('Pause animations')
    expect(markup).toContain('Animations are off because reduced motion is enabled.')
  })

  it('shows the official still separately from the retained motion previews', () => {
    const markup = renderToStaticMarkup(Comparison.render())
    expect(markup).toContain('src="/favicon.svg?v=soundlines-wave" alt="Official Soundlines favicon"')
    expect(markup).toContain('src="/favicon-light.svg?v=soundlines-wave" alt="Light theme Soundlines favicon"')
    expect(markup).toContain('favicon-preview--soundlines favicon-preview--light')
    const currentCard = markup.match(/<article\b[^>]*>[\s\S]*?<\/article>/)?.[0]
    expect(currentCard).toContain('Soundlines')
    expect(currentCard).toContain('Current')
    expect(currentCard).toContain('href="/favicon.svg?v=soundlines-wave"')
    expect(markup).toContain('Previous')
  })

  it('animates the non-wave previews only when motion is allowed and supports pausing', () => {
    const css = readFileSync(new URL('./stories/Favicon.css', import.meta.url), 'utf8')
    const motionStyles = css.match(/@media \(prefers-reduced-motion: no-preference\) \{([\s\S]*?)\n\}/)?.[1]
    expect(motionStyles).toBeDefined()
    expect(motionStyles).toMatch(/\.favicon-preview--vinyl img\s*\{[^}]*animation:/)
    expect(motionStyles).toMatch(/\.favicon-story--paused \.favicon-preview img\s*\{[^}]*animation-play-state:\s*paused;/)
  })

  it('moves the contour while retaining its original shape and fixed endpoints', () => {
    const points = Array.from({ length: 25 }, (_, index) => {
      const x = 3 + 18 * index / 24
      const y = 12 + 4 * Math.sin(2 * Math.PI * index / 24) + Math.sin(5 * Math.PI * index / 24)
      return { x, y }
    })
    const model = createWaveModel(points)
    const initial = wavePointsAt(model, 0)
    const moving = wavePointsAt(model, 0.7)

    for (let index = 0; index < points.length; index++) {
      expect(initial[index].y).toBeCloseTo(points[index].y, 10)
      expect(moving[index].x).toBe(points[index].x)
    }
    expect(moving[0]).toEqual(points[0])
    expect(moving.at(-1)).toEqual(points.at(-1))
    expect(moving[6].y).not.toBeCloseTo(initial[6].y, 2)
    expect(wavePathAt(model, 0.7)).toMatch(/^M3 12 C.* 21 12$/)
  })

  it('carries waveform features from left to right', () => {
    const intervals = 24
    const points = Array.from({ length: intervals + 1 }, (_, index) => {
      const position = index / intervals
      return {
        x: 3 + 18 * position,
        y: 12 + 4 * Math.sin(Math.PI * position) * Math.sin(2 * Math.PI * position),
      }
    })
    const model = createWaveModel(points)
    const initial = wavePointsAt(model, 0)
    const shift = 3
    const moving = wavePointsAt(model, shift / intervals)
    const carrier = (y: number, index: number) => (y - 12) / Math.sin(Math.PI * index / intervals)

    for (let index = 1; index < intervals - shift; index++) {
      expect(carrier(moving[index + shift].y, index + shift)).toBeCloseTo(carrier(initial[index].y, index), 10)
    }
    const peakIndex = (wave: typeof initial) => wave.reduce(
      (peak, point, index) => point.y > wave[peak].y ? index : peak,
      0,
    )
    expect(peakIndex(moving)).toBeGreaterThan(peakIndex(initial))
    expect(moving[0]).toEqual(points[0])
    expect(moving.at(-1)).toEqual(points.at(-1))
    for (const [index, point] of wavePointsAt(model, 1 + shift / intervals).entries()) {
      expect(point.y).toBeCloseTo(moving[index].y, 10)
    }
  })
})

describe('Soundlines brand mark', () => {
  const favicon = readFileSync(new URL('../public/favicon.svg', import.meta.url), 'utf8')

  it('rests on the official favicon frame', () => {
    const markup = renderToStaticMarkup(createElement(BrandLink, { href: '/en', children: 'Soundlines' }))
    for (const { color, d } of SOUNDLINES_WAVES) {
      expect(favicon).toContain(`<path d="${d}" stroke="${color}" />`)
      expect(markup).toContain(`d="${d}" stroke="${color}"`)
    }
    expect(favicon).toContain(`fill="${SOUNDLINES_BACKGROUND}"`)
    expect(markup).toContain(`fill="${SOUNDLINES_BACKGROUND}"`)
    expect(markup.match(new RegExp(`fill="${SOUNDLINES_ENDPOINT_COLOR}"`, 'g'))).toHaveLength(2)
    expect(markup).toContain('data-soundlines-mark')
    expect(markup).not.toContain('lucide-disc-3')
  })

  it('samples the favicon waves without a DOM and keeps their resting shape at phase zero', () => {
    for (const { d } of SOUNDLINES_WAVES) {
      const points = sampleCubicPath(d)
      expect(points[0]).toEqual({ x: 3, y: 12 })
      expect(points.at(-1)).toEqual({ x: 21, y: 12 })
      const resting = wavePointsAt(createWaveModel(points), 0)
      resting.forEach((point, index) => expect(point.y).toBeCloseTo(points[index].y, 10))
    }
    expect(() => sampleCubicPath('M3 12 L21 12')).toThrow()
  })

  function seeded(seed: number) {
    return () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296
      return seed / 4294967296
    }
  }
  const restingPoints = SOUNDLINES_WAVES.map(({ d }) => wavePointsAt(createWaveModel(sampleCubicPath(d)), 0))
  const createTapes = (seed: number) => SOUNDLINES_WAVES.map(({ d }, index) => new WaveTape(createWaveModel(sampleCubicPath(d)), seeded(seed + index)))
  const expectResting = (tapes: WaveTape[], offset: number) => tapes.forEach((tape, index) => {
    tape.pointsAt(offset).forEach((point, sample) => expect(point.y).toBeCloseTo(restingPoints[index][sample].y, 10))
  })

  it('scrolls an endless random wave that never repeats a fixed cycle', () => {
    const [tape] = createTapes(7)
    expectResting([tape], 0)
    const widths = [1, 2, 3, 4].map((width) => tape.pointsAt(width * tape.intervals).map(({ y }) => y))
    for (let a = 0; a < widths.length; a++) {
      for (let b = a + 1; b < widths.length; b++) {
        expect(Math.max(...widths[a].map((y, index) => Math.abs(y - widths[b][index])))).toBeGreaterThan(0.5)
      }
    }
    for (const width of widths) {
      expect(width[0]).toBe(12)
      expect(width.at(-1)).toBe(12)
      for (const y of width) expect(Math.abs(y - 12)).toBeLessThan(9)
    }
    expect(tape.pathAt(37.25)).toMatch(/^M3 12 C.* 21 12$/)
  })

  it('moves the random wave continuously between frames', () => {
    const [tape] = createTapes(3)
    let previous = tape.pointsAt(0)
    for (let frame = 1; frame < 6000; frame++) {
      const current = tape.pointsAt(frame * 0.02)
      current.forEach((point, index) => expect(Math.abs(point.y - previous[index].y)).toBeLessThan(0.1))
      previous = current
    }
  })

  it('brings the resting frame back in at a shared whole-sample offset', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const tapes = createTapes(seed * 11)
      const offset = 17.4 * seed
      const shown = tapes.map((tape) => tape.pointsAt(offset))
      const target = planWaveRest(tapes, offset)
      expect(Number.isInteger(target)).toBe(true)
      expect(target).toBeGreaterThan(offset + tapes[0].intervals)
      tapes.forEach((tape, index) => tape.pointsAt(offset).forEach((point, sample) => expect(point.y).toBeCloseTo(shown[index][sample].y, 10)))
      expectResting(tapes, target)
    }
  })

  it('cruises while hovered or scrolling and eases back onto the resting frame', () => {
    const motion = new SoundlinesWaveMotion(createTapes(5))
    expect(motion.step(1 / 60, null)).toBe(true)
    for (let frame = 0; frame < 120; frame++) expect(motion.step(1 / 60, HOVER_CYCLES_PER_SECOND)).toBe(false)
    expect(motion.speed).toBeGreaterThan(HOVER_CYCLES_PER_SECOND * 24 * 0.95)

    let previous = { offset: motion.offset, speed: motion.speed }
    let frames = 0
    while (!motion.step(1 / 60, null)) {
      expect(motion.offset).toBeGreaterThan(previous.offset)
      expect(Math.abs(motion.speed - previous.speed)).toBeLessThan(1)
      previous = { offset: motion.offset, speed: motion.speed }
      frames++
    }
    expect(frames).toBeLessThan(180)
    expect(previous.speed).toBeLessThan(0.5)
    expect(motion.atRest).toBe(true)
    expectResting(motion.tapes, 0)
  })

  it('resumes cruising from a settle without a speed jump and settles again', () => {
    const motion = new SoundlinesWaveMotion(createTapes(9))
    for (let frame = 0; frame < 20; frame++) motion.step(1 / 60, 0.8)
    for (let frame = 0; frame < 40; frame++) motion.step(1 / 60, null)
    const speed = motion.speed
    motion.step(1 / 60, 0.8)
    expect(Math.abs(motion.speed - speed)).toBeLessThan(1)
    for (let frame = 0; frame < 10; frame++) motion.step(1 / 60, 0.8)
    let frames = 0
    while (!motion.step(1 / 60, null)) frames++
    expect(frames).toBeLessThan(180)
    expectResting(motion.tapes, 0)
  })
})
