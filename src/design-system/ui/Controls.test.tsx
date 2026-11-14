// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, it } from 'vitest'
import { InfoBadge } from './InfoBadge.tsx'
import { SegmentedControl } from './SegmentedControl.tsx'

it('wraps segmented selection by keyboard and moves the tab stop to the new value', async () => {
  const user = userEvent.setup()
  function Filter() {
    const [value, setValue] = useState('all')
    return <SegmentedControl label="Filter entries" value={value} onChange={setValue}
      options={[{ value: 'all', content: 'All' }, { value: 'saved', content: 'Saved' }]} />
  }

  render(<Filter />)
  await user.tab()
  expect(screen.getByRole('radio', { name: 'All', checked: true })).toHaveFocus()
  await user.keyboard('{ArrowLeft}')
  expect(screen.getByRole('radio', { name: 'Saved', checked: true })).toHaveFocus()
  expect(screen.getByRole('radio', { name: 'All', checked: false })).toHaveAttribute('tabindex', '-1')
  await user.keyboard('{Home}')
  expect(screen.getByRole('radio', { name: 'All', checked: true })).toHaveFocus()
})

it('opens the information badge with Enter and returns focus from its contents on Escape', async () => {
  const user = userEvent.setup()
  render(<InfoBadge label="About the recording"><a href="#sources">Sources</a></InfoBadge>)

  await user.tab()
  const trigger = screen.getByRole('button', { name: 'About the recording', expanded: false })
  expect(trigger).toHaveFocus()
  await user.keyboard('{Enter}')
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await user.tab()
  expect(screen.getByRole('link', { name: 'Sources' })).toHaveFocus()
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('link', { name: 'Sources' })).toBeNull()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(trigger).toHaveFocus()
})
