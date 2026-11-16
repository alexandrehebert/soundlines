// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { PreviewButton } from './PreviewButton.tsx'

afterEach(cleanup)

it('keeps focus and blocks duplicate playback requests while loading', async () => {
  const user = userEvent.setup()
  const onPress = vi.fn()
  const props = { genre: 'Disco', progress: 0, onPress }
  const { rerender } = render(<PreviewButton {...props} state="ready" />)

  await user.click(screen.getByRole('button', { name: 'Play preview for Disco' }))
  expect(onPress).toHaveBeenCalledTimes(1)

  rerender(<PreviewButton {...props} state="loading" />)
  const loading = screen.getByRole('button', { name: 'Loading audio for Disco', busy: true })
  expect(document.activeElement).toBe(loading)
  expect(loading.querySelector('[data-current="true"]')).toBeNull()
  expect(screen.queryByText(/loading audio/i)).toBeNull()
  expect(loading.querySelector('.listen-loader')).not.toBeNull()
  await user.keyboard('{Enter} ')
  await user.click(loading)
  expect(onPress).toHaveBeenCalledTimes(1)

  rerender(<PreviewButton {...props} state="playing" />)
  expect(loading.querySelector('.listen-loader')).toBeNull()
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Pause preview for Disco' }))
  await user.keyboard('{Enter}')
  expect(onPress).toHaveBeenCalledTimes(2)
})
