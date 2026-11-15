// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { afterEach, expect, it, vi } from 'vitest'
import { ExplorerStoryProvider } from '../../stories/ExplorerStoryProvider.tsx'
import { catalogueFor } from '../../i18n/catalogue.ts'
import { DatasetStats } from './DatasetStats.tsx'
import { StackedBar } from './DatasetStatsCharts.tsx'

const messages = catalogueFor('en')

afterEach(() => vi.unstubAllGlobals())

it('moves focus and selection with the statistics tab keys and closes on Escape', async () => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  })))
  const onClose = vi.fn()
  const user = userEvent.setup()
  const labels = messages.stats.tabs
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ExplorerStoryProvider><DatasetStats onClose={onClose} /></ExplorerStoryProvider>
    </NextIntlClientProvider>,
  )

  expect(screen.getByRole('tab', { name: labels.overview, selected: true })).toHaveFocus()
  await user.keyboard('{ArrowRight}')
  expect(screen.getByRole('tab', { name: labels.genre, selected: true })).toHaveFocus()
  expect(screen.getByRole('tabpanel', { name: labels.genre })).toBeInTheDocument()
  await user.keyboard('{End}')
  expect(screen.getByRole('tab', { name: labels.review, selected: true })).toHaveFocus()
  await user.keyboard('{Home}{Escape}')
  expect(screen.getByRole('tab', { name: labels.overview, selected: true })).toHaveFocus()
  expect(onClose).toHaveBeenCalledOnce()
})

it('gives the stacked chart an accessible name that includes zero counts', () => {
  render(<StackedBar items={[
    { key: 'genre', label: 'Genres', count: 120, color: '#a78bfa' },
    { key: 'artist', label: 'Artists', count: 0, color: '#22d3ee' },
  ]} />)

  expect(screen.getByRole('img', { name: 'Genres: 120, Artists: 0' })).toBeInTheDocument()
  expect(screen.getByRole('list')).toHaveTextContent('Artists00%')
})
