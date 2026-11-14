// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { ExplorerStoryProvider } from '../../../.storybook/ExplorerStoryProvider.tsx'
import { useExplorer } from '../../ExplorerContext.ts'
import { EntryLink, ViewLink } from './ExplorerLinks.tsx'

it('links to explorer routes and applies selection in the explorer without page navigation', async () => {
  function Links() {
    const { index, view, selectedId } = useExplorer()
    const house = index.nodeById.get('genre:house')
    if (!house) throw new Error('House is missing from the graph fixture')
    return (
      <>
        <ViewLink className="" view="artist">Artists</ViewLink>
        <EntryLink className="" node={house}>House</EntryLink>
        <output>{selectedId ?? view}</output>
      </>
    )
  }

  const user = userEvent.setup()
  render(<ExplorerStoryProvider><Links /></ExplorerStoryProvider>)
  const artists = screen.getByRole('link', { name: 'Artists' })
  const house = screen.getByRole('link', { name: 'House' })
  expect(artists).toHaveAttribute('href', '/en/artists')
  expect(house).toHaveAttribute('href', '/en/genres?focus=genre%3Ahouse')
  await user.click(artists)
  expect(screen.getByRole('status')).toHaveTextContent('artist')
  await user.click(house)
  expect(screen.getByRole('status')).toHaveTextContent('genre:house')
})
