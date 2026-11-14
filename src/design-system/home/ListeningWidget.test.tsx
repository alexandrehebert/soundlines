// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { ExplorerStoryProvider } from '../../../.storybook/ExplorerStoryProvider.tsx'
import { renderWithIntl } from '../../test/renderWithIntl.tsx'
import { ListeningWidget } from './ListeningWidget.tsx'

it('lets listeners revisit earlier selections in the curated queue', async () => {
  const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  try {
    const user = userEvent.setup()
    renderWithIntl(
      <ExplorerStoryProvider><ListeningWidget scrollReveal={undefined} /></ExplorerStoryProvider>,
    )

    const previous = screen.getByRole('button', { name: 'Previous' })
    const next = screen.getByRole('button', { name: 'Next sound' })
    expect(previous).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Play Bossa nova' })).toBeVisible()

    await user.click(next)
    expect(screen.getByRole('button', { name: 'Play Acid jazz' })).toBeVisible()
    await user.click(next)
    expect(screen.getByRole('link', { name: 'Detroit techno' })).toHaveAttribute('href', expect.stringContaining('detroit-techno'))

    await user.click(previous)
    expect(screen.getByRole('link', { name: 'Acid jazz' })).toBeVisible()
    await user.click(previous)
    expect(screen.getByRole('link', { name: 'Bossa nova' })).toBeVisible()
    expect(previous).toBeDisabled()
  } finally {
    cleanup()
    pause.mockRestore()
  }
})
