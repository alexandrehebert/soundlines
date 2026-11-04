import { describe, expect, it } from 'vitest'
import { formatPeriod, formatYear } from './theme.ts'

describe('historical date formatting', () => {
  it('formats BCE years without introducing a year zero', () => {
    expect(formatYear(-3000)).toBe('3000 BCE')
    expect(formatYear(0)).toBe('1 BCE')
    expect(formatYear(1)).toBe('1')
  })

  it('formats periods that begin or end in BCE', () => {
    expect(formatPeriod({ start: -3000, precision: 'circa' })).toBe('c. 3000 BCE – now')
    expect(formatPeriod({ start: -3000, end: -2500 })).toBe('3000 BCE – 2500 BCE')
    expect(formatPeriod({ start: -1, end: 1 })).toBe('1 BCE – 1')
  })
})
