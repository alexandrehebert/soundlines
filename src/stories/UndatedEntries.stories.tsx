import { useState, type ComponentProps } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent } from 'storybook/test'
import { UndatedEntries } from '../design-system/timeline/UndatedEntries.tsx'

function SelectableEntries(args: ComponentProps<typeof UndatedEntries>) {
  const [selectedId, setSelectedId] = useState(args.selectedId)
  return <UndatedEntries {...args} selectedId={selectedId} onSelect={(id) => {
    setSelectedId(id)
    args.onSelect(id)
  }} />
}

const meta = {
  title: 'Visualizations/Undated entries',
  component: UndatedEntries,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    label: 'artists',
    nodes: [
      { id: 'artist:session-player', type: 'artist', name: 'Session player', family: 'jazz' },
      { id: 'artist:club-dj', type: 'artist', name: 'Club DJ', family: 'electronic' },
    ],
    selectedId: null,
    onSelect: fn(),
  },
  render: (args) => <SelectableEntries {...args} />,
} satisfies Meta<typeof UndatedEntries>

export default meta
type Story = StoryObj<typeof meta>

export const Selectable: Story = {
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole('button', { name: 'Club DJ' })
    await userEvent.click(button)
    expect(args.onSelect).toHaveBeenCalledWith('artist:club-dj')
    expect(button).toHaveAttribute('aria-pressed', 'true')
  },
}
