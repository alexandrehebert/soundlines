// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { MobileMasthead } from './MobileMasthead.tsx'

it('replaces the logo with the Library back link while an entry is open', () => {
  const onNavigate = vi.fn()
  const { rerender } = render(<MobileMasthead onNavigate={onNavigate} />)
  expect(screen.queryByText('Soundlines')).not.toBeNull()
  expect(screen.queryByRole('link', { name: 'Library' })).toBeNull()

  rerender(<MobileMasthead back={{ href: '?view=library', label: 'Library' }} onNavigate={onNavigate} />)
  expect(screen.queryByText('Soundlines')).toBeNull()
  expect(screen.getByRole('link', { name: 'Library' }).getAttribute('href')).toBe('?view=library')

  rerender(<MobileMasthead onNavigate={onNavigate} />)
  expect(screen.queryByText('Soundlines')).not.toBeNull()
  expect(screen.queryByRole('link', { name: 'Library' })).toBeNull()
})
