// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { BodyPortal } from './BodyPortal.tsx'
import { ExpandableSheet } from './ExpandableSheet.tsx'
import { ModalPanel } from './ModalPanel.tsx'

beforeEach(() => {
  vi.stubGlobal('matchMedia', (media: string) => ({
    matches: media === '(min-width: 48rem)',
    media,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('mounts a dialog in the body, traps keyboard focus, and restores the opener after Escape', async () => {
  const user = userEvent.setup()
  function Example() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>Show details</button>
        {open && (
          <BodyPortal>
            <ModalPanel title="Details" closeLabel="Close details" onClose={() => setOpen(false)}>
              <button type="button" data-panel-initial-focus>Review sources</button>
            </ModalPanel>
          </BodyPortal>
        )}
      </>
    )
  }

  const { container } = render(<Example />)
  const opener = screen.getByRole('button', { name: 'Show details' })
  await user.click(opener)
  const dialog = screen.getByRole('dialog', { name: 'Details' })
  expect(container).not.toContainElement(dialog)
  const close = within(dialog).getByRole('button', { name: 'Close details' })
  const review = within(dialog).getByRole('button', { name: 'Review sources' })
  // jsdom has no layout. Supply the visible bounds that the focus trap checks.
  for (const button of [close, review]) {
    const rect = new DOMRect(0, 0, 100, 32)
    vi.spyOn(button, 'getClientRects').mockReturnValue(Object.assign([rect], {
      item: (index: number) => index === 0 ? rect : null,
    }))
  }
  expect(review).toHaveFocus()
  await user.tab()
  expect(close).toHaveFocus()
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(opener).toHaveFocus()
})

it('toggles the expandable sheet content and calls its close action', async () => {
  const user = userEvent.setup()
  const onClose = vi.fn()
  render(
    <ExpandableSheet height={0.8} collapsedOffset={0.55} closeLabel="Close details"
      expandLabel="Expand details" collapseLabel="Collapse details" onClose={onClose}>
      {(expanded) => <p>{expanded ? 'Sources and related entries' : 'Entry preview'}</p>}
    </ExpandableSheet>,
  )

  expect(screen.getByText('Entry preview')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Expand details' }))
  expect(screen.getByText('Sources and related entries')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Collapse details' }))
  expect(screen.getByText('Entry preview')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Close details' }))
  expect(onClose).toHaveBeenCalledOnce()
})
