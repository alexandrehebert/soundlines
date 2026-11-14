import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { fn } from 'storybook/test'
import { withExplorer } from '../../.storybook/withExplorer.tsx'
import { ExplorerOptions } from '../design-system/explorer/ExplorerOptions.tsx'

function Example({ isDesktop }: { isDesktop: boolean }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="relative flex w-full max-w-md justify-end">
      {!isDesktop && <button type="button" onClick={() => setOpen(true)}>Open options</button>}
      <ExplorerOptions optionsId="story-options" optionsOpen={open} setOptionsOpen={setOpen}
        isDesktop={isDesktop} onShowStatistics={showStatistics} />
    </div>
  )
}

const showStatistics = fn()

const meta = {
  title: 'Overlays/Explorer options',
  component: Example,
  decorators: [withExplorer],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Example>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = { args: { isDesktop: true } }

export const Mobile: Story = {
  args: { isDesktop: false },
  globals: { viewport: { value: 'mobile1' } },
}
