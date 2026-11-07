import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, waitFor, within } from 'storybook/test'
import { withExplorer } from '../../.storybook/withExplorer.tsx'
import { Home } from '../components/Home.tsx'

const meta = {
  title: 'Screens/Home',
  component: Home,
  decorators: [withExplorer],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Home>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const TurntableHint: Story = {
  play: async ({ canvasElement }) => {
    const hint = canvasElement.querySelector<HTMLElement>('.discovery-turntable-hint')
    if (!hint) throw new Error('Turntable hint is missing')
    expect(hint).toHaveAttribute('aria-hidden', 'true')
    expect(getComputedStyle(hint).pointerEvents).toBe('none')
    await waitFor(() => expect(hint.querySelector('.discovery-turntable-hand')).not.toBeNull())
    const point = hint.querySelector<HTMLElement>('.discovery-turntable-point')
    const grip = hint.querySelector<HTMLElement>('.discovery-turntable-grip')
    if (!point || !grip) throw new Error('Turntable hand poses are missing')
    expect(grip.offsetTop).toBe(point.offsetTop)
    expect(grip.offsetLeft).toBe(point.offsetLeft)
    expect(getComputedStyle(grip).marginTop).toBe('0px')
    const button = canvasElement.querySelector<HTMLButtonElement>('.discovery-turntable-play')
    if (!button) throw new Error('Turntable play button is missing')
    await fireEvent.focusIn(button)
    await waitFor(() => expect(canvasElement.querySelector('.discovery-turntable-hint')).toBeNull())
    expect(button).toHaveAttribute('aria-pressed', 'false')
  },
}

export const MobileScratch: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  play: async ({ canvasElement }) => {
    const target = canvasElement.querySelector<HTMLElement>('.discovery-record-touch-target')
    const record = canvasElement.querySelector<HTMLElement>('.discovery-record-perspective')
    if (!target || !record) throw new Error('Mobile scratch target or record is missing')
    const face = record.dataset.side?.toLowerCase()
    const vinyl = record.querySelector<HTMLElement>(`.discovery-record-face-${face} .discovery-vinyl`)
    if (!vinyl) throw new Error('Visible vinyl face is missing')

    const bounds = target.getBoundingClientRect()
    const visualBounds = record.getBoundingClientRect()
    expect(Math.abs(bounds.left - visualBounds.left)).toBeLessThan(1)
    expect(Math.abs(bounds.top - visualBounds.top)).toBeLessThan(1)
    expect(bounds.width).toBeCloseTo(visualBounds.width)
    expect(getComputedStyle(target).touchAction).toBe('none')

    const start = { x: bounds.left + bounds.width * 0.3, y: bounds.top + bounds.height * 0.3 }
    const end = { x: bounds.left + bounds.width * 0.45, y: bounds.top + bounds.height * 0.7 }
    const document = canvasElement.ownerDocument
    expect(document.elementFromPoint(start.x, start.y)).toBe(target)
    expect(document.elementFromPoint(bounds.left + 10, bounds.top + 10)).not.toBe(target)
    const action = within(canvasElement).getByRole('link', { name: /Open the timeline/ })
    const actionBounds = action.getBoundingClientRect()
    expect(action.contains(document.elementFromPoint(
      actionBounds.left + actionBounds.width / 2,
      actionBounds.top + actionBounds.height / 2,
    ))).toBe(true)

    const setPointerCapture = target.setPointerCapture
    const audioConstructors = ['AudioContext', 'webkitAudioContext'] as const
    const audioDescriptors = audioConstructors.map((name) => Object.getOwnPropertyDescriptor(globalThis, name))
    target.setPointerCapture = () => {}
    try {
      for (const name of audioConstructors) {
        Object.defineProperty(globalThis, name, { configurable: true, writable: true, value: undefined })
      }
      const pointer = { pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0 }
      const initialTransform = getComputedStyle(vinyl).transform
      await fireEvent.pointerDown(target, { ...pointer, clientX: start.x, clientY: start.y })
      expect(canvasElement.querySelector('.discovery-turntable-hint')).toBeNull()
      expect(record).toHaveAttribute('data-scratching')
      await fireEvent.pointerMove(target, { ...pointer, clientX: end.x, clientY: end.y })
      await waitFor(() => expect(getComputedStyle(vinyl).transform).not.toBe(initialTransform))
      await fireEvent.pointerUp(target, { ...pointer, clientX: end.x, clientY: end.y })
      expect(record).not.toHaveAttribute('data-scratching')
      await fireEvent.pointerDown(target, { ...pointer, clientX: start.x, clientY: start.y })
      await fireEvent.pointerCancel(target, pointer)
      expect(record).not.toHaveAttribute('data-scratching')
      await fireEvent.pointerDown(target, { ...pointer, clientX: start.x, clientY: start.y })
      await fireEvent.lostPointerCapture(target, pointer)
      expect(record).not.toHaveAttribute('data-scratching')
    } finally {
      target.setPointerCapture = setPointerCapture
      audioConstructors.forEach((name, index) => {
        const descriptor = audioDescriptors[index]
        if (descriptor) Object.defineProperty(globalThis, name, descriptor)
        else Reflect.deleteProperty(globalThis, name)
      })
      await fireEvent.pointerCancel(target, { pointerId: 1, pointerType: 'touch' })
    }
  },
}
