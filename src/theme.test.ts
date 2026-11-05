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

  it('does not invent dates for omitted or null periods', () => {
    expect(formatPeriod(undefined)).toBeNull()
    expect(formatPeriod(null)).toBeNull()
  })

  it('labels estimated single dates, open careers, and historical ranges explicitly', () => {
    expect(formatPeriod({ start: 1500, precision: 'century', estimated: true })).toBe('1500 – now (estimated)')
    expect(formatPeriod({ start: 1965, end: 2013, precision: 'circa', estimated: true }))
      .toBe('c. 1965 – 2013 (estimated)')
    expect(formatPeriod({ start: -500, end: -500, estimated: true })).toBe('500 BCE (estimated)')
    expect(formatPeriod({ start: 1900, estimated: false })).toBe('1900 – now')
  })
})
