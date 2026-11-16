// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MobileBrand } from './MobileBrand.tsx'

afterEach(() => {
  vi.useRealTimers()
})

describe('MobileBrand', () => {
  it.each(['document', 'Discover feed', 'Soundtrail steps', 'Timeline'])(
    'animates when %s scrolls and returns to its resting shape', (area) => {
      vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })
      const { container } = render(
        <>
          <MobileBrand />
          <section aria-label="Discover feed">
            <section aria-label="Soundtrail steps" />
          </section>
          <section aria-label="Timeline" />
        </>,
      )
      const paths = [...container.querySelectorAll('[data-soundlines-mark] path')]
      const frame = () => paths.map((path) => path.getAttribute('d'))
      const resting = frame()
      expect(resting).toHaveLength(2)

      fireEvent.scroll(area === 'document' ? document : screen.getByRole('region', { name: area }))
      vi.advanceTimersByTime(100)
      expect(frame()).not.toEqual(resting)

      vi.advanceTimersByTime(5000)
      expect(frame()).toEqual(resting)
    },
  )
})
