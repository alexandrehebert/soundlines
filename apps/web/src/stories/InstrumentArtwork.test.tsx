// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { render, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { BeforeAndAfter } from './InstrumentArtwork.stories'

it('targets comparison sections inside the Storybook canvas', () => {
  render(BeforeAndAfter.render())
  const navigation = screen.getByRole('navigation', { name: 'Jump to an instrument' })
  const links = within(navigation).getAllByRole('link')

  for (const link of links) {
    const section = screen.getByRole('region', { name: link.textContent?.trim() })

    // The preview document defaults anchors to the parent browsing context.
    expect(link).toHaveAttribute('target', '_self')
    expect(link).toHaveAttribute('href', `#${section.id}`)
  }
})
