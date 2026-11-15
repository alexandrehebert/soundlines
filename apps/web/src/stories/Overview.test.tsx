// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { Overview } from './Overview.tsx'

afterEach(() => vi.unstubAllGlobals())

it('links each visible component in the story index to its docs or first story', async () => {
  const entries = [
    { id: 'overview--docs', title: 'Overview', type: 'docs', tags: ['dev'] },
    { id: 'controls-search--default', title: 'Controls/Search', type: 'story', tags: ['dev'] },
    { id: 'controls-search--docs', title: 'Controls/Search', type: 'docs', tags: ['dev'] },
    { id: 'controls-search--empty', title: 'Controls/Search', type: 'story', tags: ['dev'] },
    { id: 'page-loading--default', title: 'Overlays/Page Loading', type: 'story', tags: ['dev'] },
    { id: 'example--hidden', title: 'Controls/Hidden', type: 'story', tags: ['test'] },
  ]
  const index = { entries: Object.fromEntries(entries.map((entry) => [entry.id, entry])) }
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(index)))

  render(<Overview />)

  const catalogue = within(await screen.findByRole('navigation', { name: 'Styleguide sections' }))
  expect(catalogue.getAllByRole('link')).toHaveLength(2)
  expect(catalogue.getByRole('link', { name: 'Search' })).toHaveAttribute('href', './?path=/docs/controls-search--docs')
  expect(catalogue.getByRole('link', { name: 'Page Loading' })).toHaveAttribute('href', './?path=/story/page-loading--default')
})

it('shows a fallback when the story index cannot load', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 503 })))

  render(<Overview />)

  expect(await screen.findByText('Could not load the story catalogue. You can still browse the sidebar.')).toBeVisible()
})
