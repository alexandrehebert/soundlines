import type english from './locales/en-US.json'
import type { Locale } from './routing.ts'

declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale
    Messages: typeof english
  }
}
