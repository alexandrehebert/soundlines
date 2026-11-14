import type { MouseEvent } from 'react'

/** Let modified clicks open links natively; plain clicks run client-side navigation instead. */
export function follow(event: MouseEvent<HTMLAnchorElement>, navigate?: () => void) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  navigate?.()
}
