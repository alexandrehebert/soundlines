'use client'

import { MotionConfig } from 'motion/react'
import { useLayoutEffect, useMemo, type ReactNode } from 'react'
import App from './App.tsx'
import { ExplorerProvider } from './ExplorerProvider.tsx'
import { englishGraph, translateGraph, type GraphTranslation } from './data/translateGraph.ts'
import type { Locale } from './i18n/routing.ts'
import { initializeColorTheme } from './useColorTheme.ts'

export function SoundlinesProviders({ locale, overlay, children }: {
  locale: Locale
  overlay?: GraphTranslation
  children: ReactNode
}) {
  const graph = useMemo(() => overlay ? translateGraph(englishGraph, overlay) : englishGraph, [overlay])
  // Restore the preference before the loading screen reveals the page.
  useLayoutEffect(initializeColorTheme, [])

  return (
    <ExplorerProvider graph={graph} locale={locale}>
      <MotionConfig reducedMotion="user">
        {/* Keep local UI state through route commits; pages own redirects and metadata. */}
        <App />
        {children}
      </MotionConfig>
    </ExplorerProvider>
  )
}
