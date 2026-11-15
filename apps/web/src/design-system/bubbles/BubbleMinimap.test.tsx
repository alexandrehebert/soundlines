// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { useRef } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { catalogueFor } from '../../i18n/catalogue.ts'
import { BubbleMinimap } from './BubbleMinimap.tsx'

afterEach(() => vi.unstubAllGlobals())

it('pans a scroll surface by keyboard and removes the map from the tab order when collapsed', async () => {
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    disconnect() {}
  })
  const user = userEvent.setup()
  function Example() {
    const surface = useRef<HTMLDivElement>(null)
    return (
      <NextIntlClientProvider locale="en" messages={catalogueFor('en')}>
        <div aria-label="Graph viewport" role="region" ref={surface} />
        <BubbleMinimap surfaceRef={surface} links={[]} selectedId={null} distances={null} zoom={1}
          layout={{ bubbles: [], width: 1200, height: 900 }} />
      </NextIntlClientProvider>
    )
  }

  render(<Example />)
  const viewport = screen.getByRole('region', { name: 'Graph viewport' })
  Object.defineProperties(viewport, { clientWidth: { value: 400 }, clientHeight: { value: 200 } })
  const toggle = screen.getByRole('button', { name: 'Minimap', expanded: true })
  await user.tab()
  expect(toggle).toHaveFocus()
  await user.tab()
  expect(screen.getByRole('group', { name: 'Graph minimap' })).toHaveFocus()
  await user.keyboard('{ArrowRight}{ArrowDown}')
  expect(viewport.scrollLeft).toBe(100)
  expect(viewport.scrollTop).toBe(50)
  await user.click(toggle)
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByRole('group', { name: 'Graph minimap' })).toBeNull()
})
