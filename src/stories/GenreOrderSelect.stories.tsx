import type { Meta, StoryObj } from '@storybook/react-vite'
import { useArgs } from 'storybook/preview-api'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { GenreOrderSelect } from '../App.tsx'

const meta = {
  title: 'Controls/Genre order',
  component: GenreOrderSelect,
  tags: ['autodocs'],
  args: { genreOrder: 'family', changeGenreOrder: fn(), className: 'flex' },
  argTypes: {
    genreOrder: { control: 'inline-radio', options: ['family', 'oldest-first'] },
    changeGenreOrder: { control: false },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs()
    return (
      <div className="inline-flex">
        <GenreOrderSelect {...args} changeGenreOrder={(genreOrder) => {
          args.changeGenreOrder(genreOrder)
          updateArgs({ genreOrder })
        }} />
      </div>
    )
  },
} satisfies Meta<typeof GenreOrderSelect>

export default meta
type Story = StoryObj<typeof meta>

export const FamilyGroups: Story = {}
export const OldestFirst: Story = { args: { genreOrder: 'oldest-first' } }

export const KeyboardNavigation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    canvas.getByRole('radio', { name: 'Family groups' }).focus()
    await userEvent.keyboard('{End}')
    await waitFor(() => expect(canvas.getByRole('radio', { name: 'Oldest first' })).toHaveAttribute('aria-checked', 'true'))
  },
}
