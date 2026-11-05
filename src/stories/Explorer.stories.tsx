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
    const input = canvas.getByPlaceholderText('Search genres, artists, instruments, events…')
    await userEvent.click(input)
    await fireEvent.change(input, { target: { value: 'Juan' } })
    await canvas.findByRole('option', { name: 'Juan Luis Guerra Artist' })
    await waitFor(() => expect(canvasElement.querySelector('[data-timeline-axis]')).toBeInTheDocument())

    const axis = canvasElement.querySelector<HTMLElement>('[data-timeline-axis]')
    if (!axis) throw new Error('Timeline axis not found')
    const axisRect = axis.getBoundingClientRect()
    const overlappingResult = canvas.getAllByRole('option', { name: /^Juan .* Artist$/ })
      .map((option) => {
        const rect = option.getBoundingClientRect()
        return {
          option,
          left: Math.max(rect.left, axisRect.left),
          right: Math.min(rect.right, axisRect.right),
          top: Math.max(rect.top, axisRect.top),
          bottom: Math.min(rect.bottom, axisRect.bottom),
        }
      })
      .find(({ left, right, top, bottom }) => right - left > 2 && bottom - top > 2)

    if (!overlappingResult) throw new Error('Search results do not overlap the timeline axis')
    const { option, left, right, top, bottom } = overlappingResult
    const hit = canvasElement.ownerDocument.elementFromPoint((left + right) / 2, (top + bottom) / 2)
    expect(option.contains(hit)).toBe(true)

    const name = option.querySelector('span')?.textContent
    if (!name) throw new Error('Search result has no name')
    await userEvent.click(option)
    await waitFor(() => expect(canvas.getByRole('heading', { name, level: 2 })).toBeVisible())
  },
}

export const Instruments: Story = {
  parameters: { explorer: { initialView: 'instrument' } },
}

export const History: Story = {
  parameters: { explorer: { initialView: 'history' } },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const viewport = canvasElement.querySelector('[data-history-scroll]')?.getBoundingClientRect()
      const events = canvasElement.querySelectorAll('[data-history-event]')
      const above = events[0]?.querySelector('article')?.getBoundingClientRect()
      const below = events[1]?.querySelector('article')?.getBoundingClientRect()
      const nextAbove = events[2]?.querySelector('article')?.getBoundingClientRect()
      const firstMarker = events[0]?.querySelector('.history-event-marker')?.getBoundingClientRect()
      const secondMarker = events[1]?.querySelector('.history-event-marker')?.getBoundingClientRect()
      if (!viewport || !above || !below || !nextAbove || !firstMarker || !secondMarker) {
        throw new Error('History viewport, events, or timeline markers are missing')
      }
      expect(above.bottom).toBeLessThan(firstMarker.top)
      expect(below.top).toBeGreaterThan(secondMarker.bottom)
      expect(Math.abs(firstMarker.top - secondMarker.top)).toBeLessThan(1)
      expect(above.height).toBeGreaterThan(viewport.height * 0.3)
      expect(below.height).toBeGreaterThan(viewport.height * 0.3)
      expect(below.left).toBeGreaterThan(above.left)
      expect(below.left).toBeLessThan(above.right)
      expect(nextAbove.left - above.right).toBeCloseTo(48, 0)
      for (const button of canvasElement.querySelectorAll('nav[aria-label="Jump to an era"] button')) {
        const bounds = button.getBoundingClientRect()
        const label = button.querySelector('span')?.getBoundingClientRect()
        if (!label) throw new Error('Era button label is missing')
        expect(Math.abs((label.top + label.bottom - bounds.top - bounds.bottom) / 2)).toBeLessThan(1)
      }
    })
  },
}

export const HistoryFilters: Story = {
  parameters: { explorer: { initialView: 'history' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const history = within(canvas.getByRole('region', { name: 'Music history timeline' }))
    await userEvent.click(history.getByRole('button', { name: 'Landmarks' }))
    await userEvent.selectOptions(history.getByLabelText('Topic'), 'technology')
    expect(canvasElement.querySelector('[data-history-event="event:afm-recording-ban-start"]')).not.toBeInTheDocument()

    const search = canvas.getByPlaceholderText('Search genres, artists, instruments, events…')
    await userEvent.click(search)
    await fireEvent.change(search, { target: { value: 'AFM recording ban begins' } })
    await userEvent.click(await canvas.findByRole('option', { name: 'AFM recording ban begins Event' }))
    await waitFor(() => {
      expect(history.getByRole('button', { name: 'All events' })).toHaveAttribute('aria-pressed', 'true')
      expect(history.getByLabelText('Topic')).toHaveValue('all')
      expect(history.getByRole('button', { name: 'AFM recording ban begins' }))
        .toHaveAttribute('aria-pressed', 'true')
    })
    await waitFor(() => {
      const viewport = canvasElement.querySelector('[data-history-scroll]')?.getBoundingClientRect()
      const selected = canvasElement.querySelector('[data-history-event="event:afm-recording-ban-start"]')?.getBoundingClientRect()
      if (!viewport || !selected) throw new Error('History viewport or selected event is missing')
      expect(viewport.width).toBeLessThan(canvasElement.clientWidth - 350)
      expect(selected.left).toBeGreaterThanOrEqual(viewport.left - 1)
      expect(selected.right).toBeLessThanOrEqual(viewport.right + 1)
    }, { timeout: 10000 })

    await userEvent.click(history.getByRole('button', { name: 'Landmarks' }))
    await waitFor(() => {
      expect(canvasElement.querySelector('[data-history-event="event:afm-recording-ban-start"]')).not.toBeInTheDocument()
      expect(canvas.queryByRole('heading', { name: 'AFM recording ban begins', level: 2 })).not.toBeInTheDocument()
    })
    const views = within(canvas.getByRole('radiogroup', { name: 'Timeline view' }))
    await userEvent.click(views.getByRole('radio', { name: 'Genres' }))
    await userEvent.click(views.getByRole('radio', { name: 'History' }))
    expect(within(canvas.getByRole('region', { name: 'Music history timeline' }))
      .getByRole('button', { name: 'Landmarks' })).toHaveAttribute('aria-pressed', 'true')
  },
}

export const MobileHistory: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  parameters: { explorer: { initialView: 'history' } },
}

export const IndependentOrders: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const viewToggle = canvas.getByRole('radiogroup', { name: 'Timeline view' })
    const switchView = async (label: string) => {
      await userEvent.click(within(viewToggle).getByRole('radio', { name: label }))
    }
    const chooseOrder = async (label: string, order: string) => {
      await userEvent.click(canvas.getByRole('button', { name: /^Timeline options$/ }))
      const options = await canvas.findByRole('dialog', { name: 'Timeline options' })
      const toggle = within(options).getByRole('radiogroup', { name: `${label} order` })
      await userEvent.click(within(toggle).getByRole('radio', { name: order }))
      await userEvent.click(within(options).getByRole('button', { name: 'Close options' }))
      await waitFor(() => expect(canvas.queryByRole('dialog', { name: 'Timeline options' })).not.toBeInTheDocument())
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

export const DesktopOptions: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: /^Timeline options$/ })
    await userEvent.click(trigger)
    const options = await canvas.findByRole('dialog', { name: 'Timeline options' })
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(options).toHaveAttribute('aria-modal', 'false')
    expect(within(options).getByRole('group', { name: 'Genre display' })).toBeVisible()
    expect(within(options).getByRole('radiogroup', { name: 'Genre order' })).toBeVisible()
    await waitFor(() => {
      const groups = [
        within(options).getByRole('group', { name: 'Genre display' }),
        within(options).getByRole('radiogroup', { name: 'Genre order' }),
      ]
      for (const group of groups) {
        const buttons = Array.from(group.querySelectorAll('button'))
        expect(Math.abs(buttons[0].getBoundingClientRect().width - buttons[1].getBoundingClientRect().width)).toBeLessThan(1)
      }
      const dialogBounds = options.getBoundingClientRect()
      const firstGroupBounds = groups[0].getBoundingClientRect()
      const lastGroupBounds = groups[1].getBoundingClientRect()
      const leftInset = firstGroupBounds.left - dialogBounds.left
      expect(Math.abs(dialogBounds.right - firstGroupBounds.right - leftInset)).toBeLessThan(1)
      expect(Math.abs(dialogBounds.bottom - lastGroupBounds.bottom - leftInset)).toBeLessThan(1)
    })
    expect(within(options).queryByRole('button', { name: 'Dataset statistics' })).not.toBeInTheDocument()
    const legend = canvas.getByRole('region', { name: 'Timeline legend' })
    expect(within(legend).getByText('Editorial phases, not popularity scores')).toBeVisible()
    expect(within(options).getByText('Editorial phases, not popularity scores')).not.toBeVisible()
    const close = within(options).getByRole('button', { name: 'Close options' })
    expect(close).toHaveFocus()
    await userEvent.tab({ shift: true })
    expect(trigger).toHaveFocus()
    await userEvent.tab()
    expect(close).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(options).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
  },
}

export const DesktopOptionsOutsideInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: /^Timeline options$/ })
    await userEvent.click(trigger)
    let options = await canvas.findByRole('dialog', { name: 'Timeline options' })
    const artists = canvas.getByRole('radio', { name: 'Artists' })
    const bounds = artists.getBoundingClientRect()
    const hit = canvasElement.ownerDocument.elementFromPoint(
      bounds.left + bounds.width / 2, bounds.top + bounds.height / 2,
    )
    expect(artists.contains(hit)).toBe(true)
    await userEvent.click(artists)
    await waitFor(() => expect(options).not.toBeInTheDocument())
    expect(artists).toHaveAttribute('aria-checked', 'true')

    await userEvent.click(trigger)
    options = await canvas.findByRole('dialog', { name: 'Timeline options' })
    within(options).getByRole('radio', { name: 'Family groups' }).focus()
    await userEvent.tab()
    const statistics = canvas.getByRole('button', { name: /genres – show dataset statistics$/ })
    expect(statistics).toHaveFocus()
    await waitFor(() => expect(options).not.toBeInTheDocument())
    expect(statistics).toHaveFocus()

    await userEvent.click(trigger)
    options = await canvas.findByRole('dialog', { name: 'Timeline options' })
    const search = canvas.getByRole('combobox')
    await userEvent.click(search)
    await waitFor(() => expect(options).not.toBeInTheDocument())
    expect(search).toHaveFocus()

    await userEvent.click(trigger)
    options = await canvas.findByRole('dialog', { name: 'Timeline options' })
    await userEvent.click(statistics)
    expect(await canvas.findByRole('dialog', { name: 'Dataset statistics' })).toBeVisible()
    await waitFor(() => expect(options).not.toBeInTheDocument())
  },
}

export const MobileOptions: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Timeline options and legend' }))
    const options = await canvas.findByRole('dialog', { name: 'Timeline options' })
    expect(options).toHaveAttribute('aria-modal', 'true')
    expect(within(options).getByText('Editorial phases, not popularity scores')).toBeVisible()
    const statistics = within(options).getByRole('button', { name: 'Dataset statistics' })
    expect(statistics).toBeVisible()
    await userEvent.tab({ shift: true })
    expect(statistics).toHaveFocus()
    await userEvent.tab()
    expect(within(options).getByRole('button', { name: 'Close options' })).toHaveFocus()
  },
}

export const MobileHistoryOptions: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  parameters: { explorer: { initialView: 'history' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'History options' }))
    const options = await canvas.findByRole('dialog', { name: 'History options' })
    await userEvent.click(within(options).getByRole('button', { name: 'Dataset statistics' }))
    expect(await canvas.findByRole('dialog', { name: 'Dataset statistics' })).toBeVisible()
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

export const MobileDetailControls: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  parameters: { explorer: { initialSelectedId: 'genre:house' } },
  play: async ({ canvasElement }) => {
    const sheet = canvasElement.querySelector<HTMLElement>('[data-mobile-detail-sheet]')
    if (!sheet) throw new Error('Mobile detail sheet is missing')
    const close = within(sheet).getByRole('button', { name: 'Close panel' })
    await userEvent.hover(close)
    await waitFor(() => {
      const sheetRect = sheet.getBoundingClientRect()
      const closeRect = close.getBoundingClientRect()
      expect(closeRect.width).toBeGreaterThanOrEqual(44)
      expect(closeRect.height).toBeGreaterThanOrEqual(44)
      const topInset = closeRect.top - sheetRect.top - sheet.clientTop
      const rightInset = sheetRect.right - closeRect.right
      expect(topInset).toBeGreaterThan(0)
      expect(Math.abs(topInset - rightInset)).toBeLessThan(1)
      const bottomHit = canvasElement.ownerDocument.elementFromPoint(
        closeRect.left + closeRect.width / 2,
        closeRect.bottom - 2,
      )
      expect(close.contains(bottomHit)).toBe(true)
    })
    await userEvent.click(within(sheet).getByRole('button', { name: 'Expand details' }))
    expect(within(sheet).getByRole('button', { name: 'Collapse details' })).toBeVisible()
    await userEvent.click(close)
    await waitFor(() => expect(sheet).not.toBeInTheDocument())
  },
}
