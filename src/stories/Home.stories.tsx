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

const checkTurntableArtwork = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  await canvasElement.ownerDocument.fonts.ready
  const record = canvasElement.querySelector<HTMLElement>('.discovery-record-perspective')
  const caption = canvasElement.querySelector<SVGTextContentElement>('.discovery-record-caption text')
  const toggle = canvasElement.querySelector<HTMLButtonElement>('.discovery-turntable-side-toggle')
  const side = record?.dataset.side
  const label = record?.querySelector<HTMLElement>(`.discovery-record-face-${side?.toLowerCase()} .discovery-label`)
  const icon = label?.querySelector<SVGElement>('svg')
  if (!record || !caption || !toggle || !label || !icon) throw new Error('Turntable artwork is incomplete')

  expect(toggle).toHaveTextContent('Side')
  const labels = record.querySelectorAll('.discovery-label')
  expect(labels).toHaveLength(2)
  for (const faceLabel of labels) {
    expect(faceLabel.textContent?.trim()).toBe('')
    expect(faceLabel.querySelectorAll('svg')).toHaveLength(1)
  }
  const labelBounds = label.getBoundingClientRect()
  const iconBounds = icon.getBoundingClientRect()
  expect(Math.abs(labelBounds.left + labelBounds.width / 2 - iconBounds.left - iconBounds.width / 2)).toBeLessThan(1)
  expect(Math.abs(labelBounds.top + labelBounds.height / 2 - iconBounds.top - iconBounds.height / 2)).toBeLessThan(1)

  expect(record.contains(caption)).toBe(true)
  expect(caption.getNumberOfChars()).toBe('SOUNDLINES'.length)
  for (let index = 0; index < caption.getNumberOfChars(); index++) {
    const bounds = caption.getExtentOfChar(index)
    expect(bounds.width).toBeGreaterThan(0)
    expect(bounds.height).toBeGreaterThan(0)
    const nearestX = Math.max(bounds.x, Math.min(180, bounds.x + bounds.width))
    const nearestY = Math.max(bounds.y, Math.min(180, bounds.y + bounds.height))
    expect(Math.hypot(nearestX - 180, nearestY - 180)).toBeGreaterThan(180)
  }
}

export const TurntableArtwork: Story = { play: checkTurntableArtwork }

export const MobileTurntableArtwork: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  play: checkTurntableArtwork,
}

export const TurntableHint: Story = {
  play: async ({ canvasElement }) => {
    const hint = canvasElement.querySelector<HTMLElement>('.discovery-turntable-hint')
    if (!hint) throw new Error('Turntable hint is missing')
    expect(hint).toHaveAttribute('aria-hidden', 'true')
    expect(getComputedStyle(hint).pointerEvents).toBe('none')
    await waitFor(() => expect(hint.querySelector('.discovery-turntable-hand')).not.toBeNull())
    const point = hint.querySelector<HTMLElement>('.discovery-turntable-point')
    const grip = hint.querySelector<HTMLElement>('.discovery-turntable-grip')
    const hand = hint.querySelector<HTMLElement>('.discovery-turntable-hand')
    if (!point || !grip || !hand) throw new Error('Turntable hand poses are missing')
    expect(grip.offsetTop).toBe(point.offsetTop)
    expect(grip.offsetLeft).toBe(point.offsetLeft)
    expect(getComputedStyle(grip).marginTop).toBe('0px')
    const button = canvasElement.querySelector<HTMLButtonElement>('.discovery-turntable-play')
    if (!button) throw new Error('Turntable play button is missing')
    await waitFor(() => expect(Number(getComputedStyle(hand).opacity)).toBeGreaterThan(.9), { timeout: 5000 })
    await fireEvent.wheel(canvasElement, { deltaY: 20 })
    await fireEvent.pointerDown(canvasElement)
    await fireEvent.keyDown(canvasElement, { key: 'ArrowDown' })
    await fireEvent.focusIn(button)
    expect(Number(getComputedStyle(hand).opacity)).toBeGreaterThan(.9)
    expect(button).toHaveAttribute('aria-pressed', 'false')
    await fireEvent.click(button)
    await waitFor(() => expect(Number(getComputedStyle(hint).opacity)).toBe(0))
    await waitFor(() => expect(button).toHaveAttribute('aria-busy', 'false'))
    if (button.getAttribute('aria-pressed') === 'true') await fireEvent.click(button)
  },
}

export const MobileScratch: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  play: async ({ canvasElement }) => {
    const target = canvasElement.querySelector<HTMLElement>('.discovery-record-touch-target')
    const record = canvasElement.querySelector<HTMLElement>('.discovery-record-perspective')
    const hint = canvasElement.querySelector<HTMLElement>('.discovery-turntable-hint')
    if (!target || !record || !hint) throw new Error('Mobile scratch target, record, or hint is missing')
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
      await waitFor(() => expect(Number(getComputedStyle(hint).opacity)).toBe(0))
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
