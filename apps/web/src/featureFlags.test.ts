import { afterEach, describe, expect, it, vi } from 'vitest'

describe('chronology preview feature flag', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it.each([
    [undefined, false],
    ['', false],
    ['false', false],
    ['TRUE', false],
    ['true', true],
  ] as const)('uses %s as %s', async (value, enabled) => {
    vi.stubEnv('NEXT_PUBLIC_FEATURE_CHRONOLOGY_PREVIEWS', value)
    vi.resetModules()
    const { featureFlags } = await import('./featureFlags.ts')
    expect(featureFlags.chronologyPreviews).toBe(enabled)
  })
})

describe('landing page v3 feature flag', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it.each([
    [undefined, false],
    ['false', false],
    ['true', true],
  ] as const)('uses %s as %s', async (value, enabled) => {
    vi.stubEnv('NEXT_PUBLIC_FEATURE_LANDING_V3', value)
    vi.resetModules()
    const { featureFlags } = await import('./featureFlags.ts')
    expect(featureFlags.landingV3).toBe(enabled)
  })
})
