import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test'
import { withExplorer } from '../../.storybook/withExplorer.tsx'
import { Explorer } from '../App.tsx'

const meta = {
  title: 'Screens/Explorer',
  component: Explorer,
  decorators: [withExplorer],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Explorer>

export default meta
type Story = StoryObj<typeof meta>

export const Genres: Story = {}

export const Artists: Story = {
  parameters: { explorer: { initialView: 'artist' } },
}

export const SearchAboveYearAxis: Story = {
  globals: { viewport: { value: 'tablet', isRotated: false } },
  parameters: { explorer: { initialView: 'artist' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByPlaceholderText('Search genres, artists, instruments…')
    await userEvent.click(input)
    await fireEvent.change(input, { target: { value: 'Juan' } })
    await canvas.findByRole('button', { name: 'Juan Luis Guerra Artist' })
    await waitFor(() => expect(canvasElement.querySelector('[data-timeline-axis]')).toBeInTheDocument())

    const axis = canvasElement.querySelector<HTMLElement>('[data-timeline-axis]')
    if (!axis) throw new Error('Timeline axis not found')
    const axisRect = axis.getBoundingClientRect()
    const overlappingResult = canvas.getAllByRole('button', { name: /^Juan .* Artist$/ })
      .map((button) => {
        const rect = button.getBoundingClientRect()
        return {
          button,
          left: Math.max(rect.left, axisRect.left),
          right: Math.min(rect.right, axisRect.right),
          top: Math.max(rect.top, axisRect.top),
          bottom: Math.min(rect.bottom, axisRect.bottom),
        }
      })
      .find(({ left, right, top, bottom }) => right - left > 2 && bottom - top > 2)

    if (!overlappingResult) throw new Error('Search results do not overlap the timeline axis')
    const { button, left, right, top, bottom } = overlappingResult
    const hit = canvasElement.ownerDocument.elementFromPoint((left + right) / 2, (top + bottom) / 2)
    expect(button.contains(hit)).toBe(true)

    const name = button.querySelector('span')?.textContent
    if (!name) throw new Error('Search result has no name')
    await userEvent.click(button)
    await waitFor(() => expect(canvas.getByRole('heading', { name, level: 2 })).toBeVisible())
  },
}

export const Instruments: Story = {
  parameters: { explorer: { initialView: 'instrument' } },
}

export const IndependentOrders: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const viewToggle = canvas.getByRole('radiogroup', { name: 'Timeline view' })
    const switchView = async (label: string) => {
      await userEvent.click(within(viewToggle).getByRole('radio', { name: label }))
    }
    const chooseOrder = async (label: string, order: string) => {
      const toggle = canvas.getByRole('radiogroup', { name: `${label} order` })
      await userEvent.click(within(toggle).getByRole('radio', { name: order }))
    }
    const expectOrder = async (view: string, order: string) => {
      await waitFor(() => expect(canvasElement.querySelector(`[data-timeline-view="${view}"]`))
        .toHaveAttribute('data-timeline-order', order))
    }

    await chooseOrder('Genre', 'Oldest first')
    await expectOrder('genre', 'oldest-first')
    await switchView('Artists')
    await expectOrder('artist', 'family')
    await chooseOrder('Artist', 'Oldest first')
    await expectOrder('artist', 'oldest-first')
    await switchView('Instruments')
    await expectOrder('instrument', 'family')
    await chooseOrder('Instrument', 'Oldest first')
    await expectOrder('instrument', 'oldest-first')
    await switchView('Genres')
    await expectOrder('genre', 'oldest-first')
    await chooseOrder('Genre', 'Family groups')
    await switchView('Artists')
    await expectOrder('artist', 'oldest-first')
    await switchView('Instruments')
    await expectOrder('instrument', 'oldest-first')
  },
}

export const BubbleMap: Story = {
  parameters: { explorer: { initialGenreDisplay: 'bubbles' } },
}

export const WithDetails: Story = {
  parameters: { explorer: { initialSelectedId: 'genre:house' } },
}

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
}

export const MobileOptions: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Timeline options and legend' }))
    await waitFor(() => expect(canvas.getByRole('dialog', { name: 'Timeline options' })).toBeVisible())
  },
}

export const MobileInstrumentOrder: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  parameters: { explorer: { initialView: 'instrument' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Timeline options and legend' }))
    const options = await canvas.findByRole('dialog', { name: 'Timeline options' })
    const order = within(options).getByRole('radiogroup', { name: 'Instrument order' })
    await userEvent.click(within(order).getByRole('radio', { name: 'Oldest first' }))
    await waitFor(() => expect(canvasElement.querySelector('[data-timeline-view="instrument"]'))
      .toHaveAttribute('data-timeline-order', 'oldest-first'))
  },
}

export const MobileDetails: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  parameters: { explorer: { initialSelectedId: 'genre:house' } },
}
