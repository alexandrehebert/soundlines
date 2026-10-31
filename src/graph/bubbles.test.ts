import { describe, expect, it } from 'vitest'
import { initials, placeBubbles, seededRandom, type BubbleRequest } from './bubbles.ts'

const request = (key: string, x = 100): BubbleRequest => ({
  key, x, minX: 0, maxX: 400, yCenter: 100, barHalfHeight: 11,
})

describe('artist bubbles', () => {
  it('produces the same pseudo-random sequence for the same seed', () => {
    const a = seededRandom('artist:x|genre:y')
    const b = seededRandom('artist:x|genre:y')
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
    expect(seededRandom('other')()).not.toBe(seededRandom('artist:x|genre:y')())
  })

  it('places bubbles off the bar, above or below, within the bar span', () => {
    const bubbles = placeBubbles(['a', 'b', 'c', 'd', 'e', 'f'].map((key) => request(key)))
    for (const bubble of bubbles) {
      expect(Math.abs(bubble.y - 100)).toBeGreaterThanOrEqual(11 + bubble.r)
      expect(Math.abs(bubble.anchorY - 100)).toBe(11)
      expect(Math.sign(bubble.anchorY - 100)).toBe(Math.sign(bubble.y - 100))
      expect(bubble.x).toBeGreaterThanOrEqual(bubble.r)
      expect(bubble.x).toBeLessThanOrEqual(400 - bubble.r)
    }
    expect(new Set(bubbles.map((bubble) => Math.sign(bubble.y - 100))).size).toBe(2)
  })

  it('keeps bubbles at the same preferred spot from overlapping', () => {
    const bubbles = placeBubbles(['a', 'b', 'c', 'd'].map((key) => request(key)))
    for (let i = 0; i < bubbles.length; i++) {
      for (let j = i + 1; j < bubbles.length; j++) {
        const [p, q] = [bubbles[i], bubbles[j]]
        expect(Math.hypot(p.x - q.x, p.y - q.y)).toBeGreaterThanOrEqual(p.r + q.r)
      }
    }
  })

  it('is stable across renders', () => {
    const requests = ['a', 'b', 'c'].map((key) => request(key))
    expect(placeBubbles(requests)).toEqual(placeBubbles(requests))
  })

  it('walks bubbles past obstacles such as genre labels', () => {
    const label = { x1: 0, x2: 200, y1: 60, y2: 140 }
    const bubbles = placeBubbles(['a', 'b', 'c'].map((key) => request(key)), [label])
    for (const bubble of bubbles) expect(bubble.x - bubble.r).toBeGreaterThanOrEqual(200)
  })

  it('derives short initials', () => {
    expect(initials('Juan Atkins')).toBe('JA')
    expect(initials('Underground Resistance')).toBe('UR')
    expect(initials('Kraftwerk')).toBe('Kr')
    expect(initials('A Guy Called Gerald')).toBe('AG')
  })
})
