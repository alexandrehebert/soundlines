import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test'
import { withExplorer } from '../../.storybook/withExplorer.tsx'
import { useExplorer } from '../ExplorerContext.ts'
import { SearchBar } from '../components/SearchBar.tsx'

function SearchExample() {
  const { index, selectedId } = useExplorer()
  const selected = selectedId ? index.nodeById.get(selectedId) : undefined
  return (
    <div className="w-full max-w-xs">
      <SearchBar />
      <p className="mt-4 text-xs text-slate-400">
        {selected ? `Selected: ${selected.name}` : 'Select a result to inspect it.'}
      </p>
    </div>
  )
}

async function searchInStory(canvasElement: HTMLElement, query: string) {
  const canvas = within(canvasElement)
  const desktopInput = canvas.getByPlaceholderText('Search genres, artists, labels…')
  if (desktopInput.getClientRects().length > 0) {
    await userEvent.click(desktopInput)
    await fireEvent.change(desktopInput, { target: { value: query } })
    return canvas
  }

  await userEvent.click(canvas.getByRole('button', { name: 'Search music' }))
  const body = within(canvasElement.ownerDocument.body)
  const mobileInput = await body.findByPlaceholderText('Genres, artists, labels…')
  await userEvent.click(mobileInput)
  await fireEvent.change(mobileInput, { target: { value: query } })
  return body
}

const meta = {
  title: 'Components/Search',
  component: SearchBar,
  decorators: [withExplorer],
  render: () => <SearchExample />,
} satisfies Meta<typeof SearchBar>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = {}

export const Results: Story = {
  play: async ({ canvasElement }) => {
    const search = await searchInStory(canvasElement, 'house')
    await expect(await search.findByText('House', { exact: true })).toBeInTheDocument()
  },
}

export const NoMatches: Story = {
  play: async ({ canvasElement }) => {
    const search = await searchInStory(canvasElement, 'zzzz-no-such-genre')
    await expect(await search.findByText('No matches')).toBeInTheDocument()
  },
}

export const MobileSearch: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Search music' }))
    await waitFor(() => expect(within(canvasElement.ownerDocument.body).getByRole('dialog', { name: 'Search music' })).toBeVisible())
  },
}
