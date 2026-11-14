import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { ModalPanel } from '../components/ui/ModalPanel.tsx'

function Example() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className="rounded-full border border-slate-700 px-4 py-2" onClick={() => setOpen(true)}>
        Show details
      </button>
      {open && (
        <ModalPanel title="Dataset details" description="Review the dataset before exporting." closeLabel="Close details" onClose={() => setOpen(false)}>
          <div className="overflow-auto p-5">
            <label className="flex items-center gap-2">
              <input type="checkbox" data-panel-initial-focus />
              Include sources
            </label>
          </div>
        </ModalPanel>
      )}
    </>
  )
}

const meta = {
  title: 'Overlays/Modal panel',
  component: Example,
} satisfies Meta<typeof Example>

export default meta
type Story = StoryObj<typeof meta>

export const OpenPanel: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Show details' }))
    await expect(await canvas.findByRole('dialog', { name: 'Dataset details' })).toBeVisible()
    await expect(canvas.getByRole('checkbox', { name: 'Include sources' })).toHaveFocus()
  },
}

export const Mobile: Story = {
  ...OpenPanel,
  globals: { viewport: { value: 'mobile1' } },
}

export const EscapeRestoresFocus: Story = {
  play: async (context) => {
    await OpenPanel.play?.(context)
    const canvas = within(context.canvasElement)
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(canvas.queryByRole('dialog')).not.toBeInTheDocument())
    await expect(canvas.getByRole('button', { name: 'Show details' })).toHaveFocus()
  },
}
