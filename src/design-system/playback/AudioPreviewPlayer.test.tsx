// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { renderWithIntl } from '../../test/renderWithIntl.tsx'
import { AudioPreviewPlayer } from './AudioPreviewPlayer.tsx'

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

it('exposes the media state and lets a listener pause playback', async () => {
  const user = userEvent.setup()
  let paused = true
  vi.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockImplementation(() => paused)
  const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
  const { container } = renderWithIntl(<AudioPreviewPlayer url="/jazz.m4a" label="Jazz" />)
  const audio = container.querySelector('audio')!

  await user.click(screen.getByRole('button', { name: 'Play Jazz' }))
  expect(play).toHaveBeenCalledOnce()
  expect(screen.getByRole('status')).toHaveTextContent('Buffering audio')

  paused = false
  fireEvent.play(audio)
  fireEvent.playing(audio)
  expect(screen.getByRole('status')).toBeEmptyDOMElement()
  await user.click(screen.getByRole('button', { name: 'Pause Jazz' }))
  expect(audio.pause).toHaveBeenCalledOnce()

  paused = true
  fireEvent.pause(audio)
  expect(screen.getByRole('button', { name: 'Play Jazz' })).toBeVisible()
})

it('reports a failed audio request', async () => {
  const user = userEvent.setup()
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockRejectedValue(new Error('Unavailable'))
  renderWithIntl(<AudioPreviewPlayer url="/missing.m4a" label="Jazz" />)

  await user.click(screen.getByRole('button', { name: 'Play Jazz' }))
  expect(await screen.findByRole('status')).toHaveTextContent('This sample could not be loaded.')
  expect(screen.queryByRole('button', { name: 'Play Jazz' })).not.toBeInTheDocument()
})
