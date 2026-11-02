import type { Meta, StoryObj } from '@storybook/react-vite'
import { useArgs } from 'storybook/preview-api'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { ViewToggle } from '../App.tsx'

const meta = {
  title: 'Controls/Timeline view',
  component: ViewToggle,
  tags: ['autodocs'],
  args: { view: 'genre', changeView: fn() },
  argTypes: {
    view: { control: 'inline-radio', options: ['genre', 'artist', 'instrument'] },
    changeView: { control: false },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs()
    return (
      <div className="inline-flex">
        <ViewToggle {...args} changeView={(view) => {
          args.changeView(view)
          updateArgs({ view })
        }} />
      </div>
    )
  },
} satisfies Meta<typeof ViewToggle>

export default meta
type Story = StoryObj<typeof meta>

export const Genres: Story = {}
export const Artists: Story = { args: { view: 'artist' } }
export const Instruments: Story = { args: { view: 'instrument' } }

export const KeyboardNavigation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    canvas.getByRole('radio', { name: 'Genres' }).focus()
    await userEvent.keyboard('{ArrowRight}')
    await waitFor(() => expect(canvas.getByRole('radio', { name: 'Artists' })).toHaveAttribute('aria-checked', 'true'))
    await userEvent.keyboard('{ArrowRight}')
    await waitFor(() => expect(canvas.getByRole('radio', { name: 'Instruments' })).toHaveAttribute('aria-checked', 'true'))
  },
}
