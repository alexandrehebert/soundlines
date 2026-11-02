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
  const desktopInput = canvas.getByPlaceholderText('Search genres, artists, instruments, events…')
  if (desktopInput.getClientRects().length > 0) {
    await userEvent.click(desktopInput)
    await fireEvent.change(desktopInput, { target: { value: query } })
    return { search: canvas, input: desktopInput }
  }

  await userEvent.click(canvas.getByRole('button', { name: 'Search music' }))
  const body = within(canvasElement.ownerDocument.body)
  const mobileInput = await body.findByPlaceholderText('Genres, artists, instruments, events…')
  await userEvent.click(mobileInput)
  await fireEvent.change(mobileInput, { target: { value: query } })
  return { search: body, input: mobileInput }
}

async function checkKeyboardNavigation(canvasElement: HTMLElement) {
  const { search, input } = await searchInStory(canvasElement, 'house')
  const options = search.getAllByRole('option')
  expect(options.length).toBeGreaterThan(1)
  expect(input).toHaveAttribute('aria-expanded', 'true')
  expect(input).toHaveAttribute('aria-controls', search.getByRole('listbox', { name: 'Search results' }).id)
  expect(input).not.toHaveAttribute('aria-activedescendant')

  await userEvent.keyboard('{ArrowDown}')
  expect(input).toHaveFocus()
  expect(input).toHaveAttribute('aria-activedescendant', options[0].id)
  expect(options[0]).toHaveAttribute('aria-selected', 'true')

  await userEvent.keyboard('{ArrowUp}')
  const last = options[options.length - 1]
  expect(input).toHaveAttribute('aria-activedescendant', last.id)
  expect(options[0]).toHaveAttribute('aria-selected', 'false')
  const list = search.getByRole('listbox', { name: 'Search results' })
  const scroller = input.closest('[role="dialog"]') ? list.parentElement : list
  if (!scroller) throw new Error('Search result scroller not found')
  await waitFor(() => {
    const bounds = scroller.getBoundingClientRect()
    const active = last.getBoundingClientRect()
    expect(active.top).toBeGreaterThanOrEqual(bounds.top - 1)
    expect(active.bottom).toBeLessThanOrEqual(bounds.bottom + 1)
  })
  await userEvent.keyboard('{ArrowDown}{ArrowDown}')
  expect(input).toHaveAttribute('aria-activedescendant', options[1].id)
  expect(options[1]).toHaveAttribute('aria-selected', 'true')

  const name = options[1].querySelector('span')?.textContent
  if (!name) throw new Error('Search result has no name')
  await userEvent.keyboard('{Enter}')
  await waitFor(() => expect(within(canvasElement).getByText(`Selected: ${name}`)).toBeVisible())
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
    const { search } = await searchInStory(canvasElement, 'house')
    await expect(await search.findByText('House', { exact: true })).toBeInTheDocument()
  },
}

export const NoMatches: Story = {
  play: async ({ canvasElement }) => {
    const { search } = await searchInStory(canvasElement, 'zzzz-no-such-genre')
    await expect(await search.findByText('No matches')).toBeInTheDocument()
  },
}

export const KeyboardNavigation: Story = {
  play: async ({ canvasElement }) => {
    await checkKeyboardNavigation(canvasElement)
  },
}

export const KeyboardQueryChange: Story = {
  play: async ({ canvasElement }) => {
    const { search, input } = await searchInStory(canvasElement, 'house')
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    expect(input).toHaveAttribute('aria-activedescendant')
    await fireEvent.change(input, { target: { value: 'hous' } })
    expect(input).not.toHaveAttribute('aria-activedescendant')
    const options = search.getAllByRole('option')
    expect(options[1]).toHaveAttribute('aria-selected', 'false')
    const name = options[0].querySelector('span')?.textContent
    if (!name) throw new Error('Search result has no name')
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(within(canvasElement).getByText(`Selected: ${name}`)).toBeVisible())
  },
}

export const KeyboardModifiedEnter: Story = {
  play: async ({ canvasElement }) => {
    await searchInStory(canvasElement, 'house')
    await userEvent.keyboard('{Control>}{Enter}{/Control}')
    await waitFor(() => expect(within(canvasElement).getByText('Selected: House')).toBeVisible())
  },
}

export const KeyboardEmptyAndEscape: Story = {
  play: async ({ canvasElement }) => {
    const { search, input } = await searchInStory(canvasElement, 'zzzz-no-such-genre')
    expect(search.getByRole('status')).toHaveTextContent('No matches')
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(input).not.toHaveAttribute('aria-controls')
    await userEvent.keyboard('{ArrowDown}{ArrowUp}{Enter}')
    expect(input).toHaveValue('zzzz-no-such-genre')
    expect(within(canvasElement).getByText('Select a result to inspect it.')).toBeVisible()
    const mobile = Boolean(input.closest('[role="dialog"]'))
    await userEvent.keyboard('{Escape}')
    if (mobile) {
      const button = within(canvasElement).getByRole('button', { name: 'Search music' })
      await waitFor(() => expect(button).toHaveFocus())
      await userEvent.click(button)
      const reopened = await search.findByRole('combobox', { name: 'Search music' })
      expect(reopened).toHaveValue('')
    } else {
      expect(input).toHaveValue('')
    }
    expect(search.queryByRole('status')).not.toBeInTheDocument()
  },
}

export const KeyboardComposition: Story = {
  play: async ({ canvasElement }) => {
    const { input } = await searchInStory(canvasElement, 'house')
    await fireEvent.keyDown(input, { key: 'ArrowDown', isComposing: true })
    await fireEvent.keyDown(input, { key: 'Enter', isComposing: true })
    await fireEvent.keyDown(input, { key: 'ArrowDown', keyCode: 229 })
    await fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 })
    let escapeBubbled = false
    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') escapeBubbled = true
    }
    const document = canvasElement.ownerDocument
    document.addEventListener('keydown', onDocumentKeyDown)
    try {
      expect(await fireEvent.keyDown(input, { key: 'Escape', isComposing: true })).toBe(true)
      expect(await fireEvent.keyDown(input, { key: 'Escape', keyCode: 229 })).toBe(true)
    } finally {
      document.removeEventListener('keydown', onDocumentKeyDown)
    }
    expect(escapeBubbled).toBe(false)
    expect(input).not.toHaveAttribute('aria-activedescendant')
    expect(input).toHaveValue('house')
    expect(within(canvasElement).getByText('Select a result to inspect it.')).toBeVisible()
    await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}')
    expect(input).not.toHaveAttribute('aria-activedescendant')
  },
}

export const MobileSearch: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Search music' }))
    await waitFor(() => expect(within(canvasElement.ownerDocument.body).getByRole('dialog', { name: 'Search music' })).toBeVisible())
  },
}

export const MobileKeyboardNavigation: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  play: async ({ canvasElement }) => {
    await checkKeyboardNavigation(canvasElement)
  },
}

export const MobileEscape: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  play: async ({ canvasElement }) => {
    await searchInStory(canvasElement, 'house')
    await userEvent.keyboard('{ArrowDown}{Escape}')
    const button = within(canvasElement).getByRole('button', { name: 'Search music' })
    await waitFor(() => expect(button).toHaveFocus())
    await userEvent.click(button)
    const reopened = await within(canvasElement.ownerDocument.body).findByRole('combobox', { name: 'Search music' })
    expect(reopened).toHaveValue('')
  },
}

export const MobileEscapeFromCloseButton: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  parameters: { explorer: { initialSelectedId: 'genre:house' } },
  play: async ({ canvasElement }) => {
    const { search } = await searchInStory(canvasElement, 'rai')
    search.getByRole('button', { name: 'Close search' }).focus()
    await userEvent.keyboard('{Escape}')
    const canvas = within(canvasElement)
    expect(canvas.getByText('Selected: House')).toBeVisible()
    const button = canvas.getByRole('button', { name: 'Search music' })
    await waitFor(() => expect(button).toHaveFocus())
    await userEvent.click(button)
    const reopened = await search.findByRole('combobox', { name: 'Search music' })
    expect(reopened).toHaveValue('')
  },
}

export const MobileFocusTrap: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  play: async ({ canvasElement }) => {
    const { search, input } = await searchInStory(canvasElement, 'house')
    const close = search.getByRole('button', { name: 'Close search' })
    await userEvent.keyboard('{Tab}')
    expect(close).toHaveFocus()
    await userEvent.keyboard('{Tab}')
    expect(input).toHaveFocus()
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
    expect(close).toHaveFocus()
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
    expect(input).toHaveFocus()
  },
}

export const MobileClosePreservesQuery: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  play: async ({ canvasElement }) => {
    const { search } = await searchInStory(canvasElement, 'house')
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    await userEvent.click(search.getByRole('button', { name: 'Close search' }))
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: 'Search music' })
    await waitFor(() => expect(button).toHaveFocus())
    await userEvent.click(button)
    const reopened = await search.findByRole('combobox', { name: 'Search music' })
    expect(reopened).toHaveValue('house')
    expect(reopened).not.toHaveAttribute('aria-activedescendant')
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(canvas.getByText('Selected: House')).toBeVisible())
  },
}

export const MobilePointerSelection: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  play: async ({ canvasElement }) => {
    const { search } = await searchInStory(canvasElement, 'house')
    await userEvent.click(search.getByRole('option', { name: 'Acid house Genre' }))
    await waitFor(() => expect(within(canvasElement).getByText('Selected: Acid house')).toBeVisible())
  },
}
