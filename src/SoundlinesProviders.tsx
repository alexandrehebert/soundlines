'use client'

import { MotionConfig } from 'motion/react'
import { useMemo, type ReactNode } from 'react'
import { ExplorerProvider } from './ExplorerProvider.tsx'
import { graphForLocale } from './data/graphLocale.ts'
import type { Locale } from './i18n/routing.ts'
import { useColorTheme } from './useColorTheme.ts'

export function SoundlinesProviders({ locale, children }: { locale: Locale; children: ReactNode }) {
  const graph = useMemo(() => graphForLocale(locale), [locale])
  useColorTheme()

  return (
    <ExplorerProvider graph={graph} locale={locale}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </ExplorerProvider>
  )
}
