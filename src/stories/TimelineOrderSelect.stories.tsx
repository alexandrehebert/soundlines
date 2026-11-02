import type { Meta, StoryObj } from '@storybook/react-vite'
import { useArgs } from 'storybook/preview-api'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { TimelineOrderSelect } from '../App.tsx'

const meta = {
  title: 'Controls/Timeline order',
  component: TimelineOrderSelect,
  tags: ['autodocs'],
  args: { view: 'genre', order: 'family', changeOrder: fn(), className: 'flex' },
  argTypes: {
    view: { control: 'inline-radio', options: ['genre', 'artist', 'instrument'] },
    order: { control: 'inline-radio', options: ['family', 'oldest-first'] },
    changeOrder: { control: false },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs()
    return (
      <div className="inline-flex">
        <TimelineOrderSelect {...args} changeOrder={(order) => {
          args.changeOrder(order)
          updateArgs({ order })
        }} />
      </div>
    )
  },
} satisfies Meta<typeof TimelineOrderSelect>

export default meta
type Story = StoryObj<typeof meta>

export const FamilyGroups: Story = {}
export const OldestFirst: Story = { args: { order: 'oldest-first' } }
export const Artists: Story = { args: { view: 'artist' } }
export const Instruments: Story = { args: { view: 'instrument' } }

export const KeyboardNavigation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    canvas.getByRole('radio', { name: 'Family groups' }).focus()
    await userEvent.keyboard('{End}')
    await waitFor(() => expect(canvas.getByRole('radio', { name: 'Oldest first' })).toHaveAttribute('aria-checked', 'true'))
  },
}
