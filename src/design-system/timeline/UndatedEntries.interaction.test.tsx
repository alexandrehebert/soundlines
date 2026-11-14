// @vitest-environment jsdom
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import type { GraphNode } from '../../graph/types.ts'
import { renderWithIntl } from '../../test/renderWithIntl.tsx'
import { UndatedEntries } from './UndatedEntries.tsx'

it('offers a keyboard-accessible selection for entries without dates', async () => {
  const user = userEvent.setup()
  const onSelect = vi.fn()
  const nodes: GraphNode[] = [{ id: 'artist:session-player', type: 'artist', name: 'Session player' }]
  renderWithIntl(<UndatedEntries label="artists" nodes={nodes} selectedId={null} onSelect={onSelect} />)

  const region = screen.getByRole('region', { name: /undated artists/i })
  const entry = within(region).getByRole('button', { name: 'Session player', pressed: false })
  await user.tab()
  expect(entry).toHaveFocus()
  await user.keyboard('{Enter}')
  expect(onSelect).toHaveBeenCalledWith('artist:session-player')
})
