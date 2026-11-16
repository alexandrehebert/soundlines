// @vitest-environment jsdom

import graph from '@soundlines/catalogue/data/graph.json'
import type { MusicGraph } from '@soundlines/catalogue/types'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { createFeed } from './feed.ts'
import { SearchPage } from './SearchPage.tsx'

const catalogue = createFeed(graph as MusicGraph)

afterEach(cleanup)

describe('mobile catalogue search', () => {
  it('finds catalogue names without accents and links to their mobile timeline entries', async () => {
    const user = userEvent.setup()
    render(<SearchPage catalogue={catalogue} loadFailed={false} hidden={false} headingRef={null} />)

    const input = screen.getByRole('searchbox', { name: 'Search the catalogue' })
    await user.type(input, 'rai')
    const result = screen.getByRole('link', { name: 'Raï genre' })
    expect(result.getAttribute('href')).toBe('?view=library&node=genre%3Arai&from=search')

    await user.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(document.activeElement).toBe(input)
    await user.type(input, 'qyzzqykqz')
    expect(screen.getByRole('status').textContent).toBe('No matches found.')
  })

  it('searches spotlight entries as well as regular feed entries', async () => {
    const user = userEvent.setup()
    render(<SearchPage catalogue={catalogue} loadFailed={false} hidden={false} headingRef={null} />)

    await user.click(screen.getByRole('button', { name: 'Planet Rock' }))
    const result = screen.getByRole('link', { name: 'Planet Rock track' })
    expect(result.getAttribute('href')).toBe('?view=library&node=track%3Aplanet-rock&from=search')
  })
})

it('keeps the search input usable while the catalogue is loading', async () => {
  const user = userEvent.setup()
  const props = { loadFailed: false, hidden: false, headingRef: null }
  const { rerender } = render(<SearchPage {...props} />)
  expect(screen.getByRole('status', { name: 'Loading the catalogue' })).toBeTruthy()
  await user.type(screen.getByRole('searchbox'), 'rai')
  expect(screen.queryByRole('list')).toBeNull()

  rerender(<SearchPage {...props} catalogue={catalogue} />)
  expect(screen.queryByRole('status', { name: 'Loading the catalogue' })).toBeNull()
  expect(screen.getByRole('link', { name: 'Raï genre' })).toBeTruthy()
})
