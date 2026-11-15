// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { useState } from 'react'
import { expect, it, vi } from 'vitest'
import { ExplorerStoryProvider } from '../../stories/ExplorerStoryProvider.tsx'
import { catalogueFor } from '../../i18n/catalogue.ts'
import { ExplorerOptions } from './ExplorerOptions.tsx'

it('opens the timeline options, delegates the statistics action, and restores focus when closed', async () => {
  const showStatistics = vi.fn()
  const user = userEvent.setup()

  function Options() {
    const [open, setOpen] = useState(false)
    return <ExplorerOptions optionsId="timeline-options" optionsOpen={open} setOptionsOpen={setOpen}
      isDesktop onShowStatistics={showStatistics} />
  }

  render(
    <NextIntlClientProvider locale="en" messages={catalogueFor('en')}>
      <ExplorerStoryProvider><Options /></ExplorerStoryProvider>
    </NextIntlClientProvider>,
  )
  const trigger = screen.getByRole('button', { name: 'Timeline options', expanded: false })
  await user.click(trigger)
  const dialog = within(screen.getByRole('dialog', { name: 'Timeline options' }))
  const close = dialog.getByRole('button', { name: 'Close options' })
  expect(close).toHaveFocus()
  await user.click(dialog.getByRole('button', { name: 'Dataset statistics' }))
  expect(showStatistics).toHaveBeenCalledOnce()
  await user.click(close)
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(trigger).toHaveFocus()
})
