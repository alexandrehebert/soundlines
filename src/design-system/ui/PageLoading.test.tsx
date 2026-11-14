// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { PageLoading } from './PageLoading.tsx'

it('announces loading with the supplied label and starts the app opening transition', () => {
  render(<PageLoading label="Chargement de Soundlines" />)

  const status = screen.getByRole('status', { name: 'Chargement de Soundlines' })
  expect(status).toHaveAttribute('data-loading', 'true')
  expect(status).toHaveAttribute('data-opening')
  expect(status).toHaveTextContent('Soundlines')
})
