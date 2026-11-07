import { describe, expect, it } from 'vitest'
import saxophoneIcon from '../../../public/instrument-icons/saxophone.svg?raw'
import { readIconBlueprint } from './blueprint.ts'

describe('artwork blueprint geometry', () => {
  it('reads the generated saxophone path and canvas', () => {
    const blueprint = readIconBlueprint(saxophoneIcon)
    expect(saxophoneIcon).toContain(`d="${blueprint.path}"`)
    expect(blueprint.viewBox).toEqual({ x: 0, y: 0, width: 24, height: 24 })
    expect(blueprint.curve.start).toHaveLength(2)
    expect(blueprint.curve.end).toHaveLength(2)
  })

  it('extracts the endpoints and handles of an absolute cubic curve', () => {
    const blueprint = readIconBlueprint('<svg viewBox="0 0 24 24"><path d="M10.95 6C10.8 3.36 9.4 2.07 6.82 2.4L5 3"/></svg>')
    expect(blueprint.curve).toEqual({
      start: [10.95, 6],
      control1: [10.8, 3.36],
      control2: [9.4, 2.07],
      end: [6.82, 2.4],
    })
  })

  it('reads compact coordinates and another canvas', () => {
    const blueprint = readIconBlueprint('<svg viewBox="-1 -2 32 48"><path d="M-2-3C-4-5-6-7-8-9L0 0"/></svg>')
    expect(blueprint.viewBox).toEqual({ x: -1, y: -2, width: 32, height: 48 })
    expect(blueprint.curve).toEqual({
      start: [-2, -3],
      control1: [-4, -5],
      control2: [-6, -7],
      end: [-8, -9],
    })
  })

  it('reports missing geometry and unsupported curves', () => {
    expect(() => readIconBlueprint('<svg/>')).toThrow('viewBox and path')
    expect(() => readIconBlueprint('<svg viewBox="0 0 0 24"><path d="M1 2C3 4 5 6 7 8"/></svg>')).toThrow('valid SVG viewBox')
    expect(() => readIconBlueprint('<svg viewBox="0 0 24 24"><path d="M1 2L3 4"/></svg>')).toThrow('initial absolute move and cubic curve')
  })
})
