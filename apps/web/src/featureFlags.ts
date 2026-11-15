// Build-time switches for unfinished features. Read them at render time so tests and stories can toggle them.
export const featureFlags = {
  turntableTonearm: process.env.NEXT_PUBLIC_FEATURE_TURNTABLE_TONEARM === 'true',
  soundtrails: process.env.NEXT_PUBLIC_FEATURE_SOUNDTRAILS === 'true',
  chronologyPreviews: process.env.NEXT_PUBLIC_FEATURE_CHRONOLOGY_PREVIEWS === 'true',
  landingV3: process.env.NEXT_PUBLIC_FEATURE_LANDING_V3 === 'true',
}

export type FeatureFlag = keyof typeof featureFlags

export function withFeatureFlag(flag: FeatureFlag, enabled: boolean) {
  const previous = featureFlags[flag]
  featureFlags[flag] = enabled
  return () => {
    featureFlags[flag] = previous
  }
}
