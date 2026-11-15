// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { renderWithIntl } from '../../test/renderWithIntl.tsx'
import { WidgetNav } from './WidgetNav.tsx'

it('skips the disabled previous action when navigating with the keyboard', async () => {
  const user = userEvent.setup()
  const onPrevious = vi.fn()
  const onNext = vi.fn()
  const { rerender } = renderWithIntl(
    <WidgetNav nextLabel="Next sound" onPrevious={onPrevious} onNext={onNext} previousDisabled />,
  )

  const previous = screen.getByRole('button', { name: 'Previous' })
  expect(previous).toBeDisabled()
  await user.tab()
  expect(screen.getByRole('button', { name: 'Next sound' })).toHaveFocus()
  await user.keyboard('{Enter}')
  expect(onNext).toHaveBeenCalledOnce()

  rerender(<WidgetNav nextLabel="Next sound" onPrevious={onPrevious} onNext={onNext} />)
  await user.tab({ shift: true })
  expect(previous).toHaveFocus()
  await user.keyboard('{Enter}')
  expect(onPrevious).toHaveBeenCalledOnce()
})
