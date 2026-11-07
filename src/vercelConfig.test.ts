import { describe, expect, it } from 'vitest'
import config from '../vercel.json'

describe('Vercel deployment configuration', () => {
  it('uses the Next.js builder instead of a static output directory', () => {
    expect(config.framework).toBe('nextjs')
    expect(config).not.toHaveProperty('outputDirectory')
  })
})
