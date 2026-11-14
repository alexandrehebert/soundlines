import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { SegmentedControl } from '../components/ui/SegmentedControl.tsx'

const options = [
  { value: 'all', content: 'All' },
  { value: 'recent', content: 'Recent' },
  { value: 'saved', content: 'Saved' },
]

function Example() {
  const [value, setValue] = useState('all')
  return (
    <div className="w-full max-w-64">
      <SegmentedControl label="Filter entries" value={value} onChange={setValue} options={options} />
    </div>
  )
}

const meta = {
  title: 'Controls/Segmented control',
  component: Example,
} satisfies Meta<typeof Example>

export default meta
type Story = StoryObj<typeof meta>

export const KeyboardSelection: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const all = canvas.getByRole('radio', { name: 'All' })
    const saved = canvas.getByRole('radio', { name: 'Saved' })
    all.focus()
    await userEvent.keyboard('{ArrowLeft}')
    await expect(saved).toHaveFocus()
    await expect(saved).toHaveAttribute('aria-checked', 'true')
    await userEvent.keyboard('{Home}')
    await expect(all).toHaveFocus()
    await expect(all).toHaveAttribute('aria-checked', 'true')
  },
}
