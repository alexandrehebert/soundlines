import type { KeyboardEvent } from 'react'

export function trapTabFocus(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return

  const controls = [...event.currentTarget.querySelectorAll<HTMLElement>(
    'button, a[href], input, select, textarea, summary, audio[controls], [tabindex]',
  )].filter((element) => element.tabIndex >= 0
    && !element.matches(':disabled')
    && !element.closest('[inert]')
    && element.getClientRects().length > 0
    && getComputedStyle(element).visibility === 'visible')
  const first = controls[0]
  const last = controls.at(-1)
  const active = event.currentTarget.ownerDocument.activeElement
  const from = event.shiftKey ? first : last
  const to = event.shiftKey ? last : first
  if (active === from && to) {
    event.preventDefault()
    to.focus()
  }
}
