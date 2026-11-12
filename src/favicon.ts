import { publicAsset } from './publicAsset.ts'
import type { ColorTheme } from './useColorTheme.ts'

export function faviconUrl(theme: ColorTheme): string {
  return publicAsset(theme === 'light' ? '/favicon-light.svg?v=soundlines-blue' : '/favicon.svg?v=soundlines')
}
