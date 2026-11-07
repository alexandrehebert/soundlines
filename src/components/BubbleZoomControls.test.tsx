import { describe, expect, it, vi } from 'vitest'
import { BubbleZoomControls } from './BubbleZoomControls.tsx'
import { MAX_BUBBLE_ZOOM, MIN_BUBBLE_ZOOM } from './bubbleViewport.ts'
import { renderWithIntl } from '../i18n/test-utils.tsx'

function renderControls(zoom: number, locale: 'en-US' | 'fr' = 'en-US') {
  return renderWithIntl(<BubbleZoomControls zoom={zoom} onZoom={vi.fn()} />, locale)
}

function button(markup: string, label: string) {
  const match = markup.match(new RegExp(`<button\\b[^>]*aria-label="${label}"[^>]*>`))
  if (!match) throw new Error(`Missing ${label} button`)
  return match[0]
}

describe('bubble zoom controls', () => {
  it('localizes accessible controls in French', () => {
    const markup = renderControls(0.75, 'fr')
    expect(markup).toContain('aria-label="Zoom des bulles"')
    expect(markup).toContain('aria-label="Dézoomer les bulles"')
    expect(markup).toContain('aria-label="Zoomer les bulles"')
  })

  it('shows the current zoom with two enabled, labeled controls', () => {
    const markup = renderControls(0.75)
    expect(markup).toContain('role="group" aria-label="Bubble zoom"')
    expect(markup).toContain('75%')
    expect(button(markup, 'Zoom out bubbles')).not.toContain('disabled=""')
    expect(button(markup, 'Zoom in bubbles')).not.toContain('disabled=""')
  })

  it('disables only the control at the corresponding zoom limit', () => {
    const minimum = renderControls(MIN_BUBBLE_ZOOM)
    const maximum = renderControls(MAX_BUBBLE_ZOOM)
    expect(button(minimum, 'Zoom out bubbles')).toContain('disabled=""')
    expect(button(minimum, 'Zoom in bubbles')).not.toContain('disabled=""')
    expect(button(maximum, 'Zoom out bubbles')).not.toContain('disabled=""')
    expect(button(maximum, 'Zoom in bubbles')).toContain('disabled=""')
  })
})
