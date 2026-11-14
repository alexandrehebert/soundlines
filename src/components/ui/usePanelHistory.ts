import { useCallback, useEffect, useRef, useState } from 'react'

type PanelEntry = { name: string; value: string }
let panelTraversalPending = false

function currentPanel(): PanelEntry | undefined {
  return window.history.state?.soundlinesPanel
}

export function afterClosingHistoryPanel(navigate?: () => void) {
  if (!currentPanel()) {
    navigate?.()
    return
  }
  backFromPanel(navigate)
}

export function backFromPanel(onBack?: () => void) {
  if (panelTraversalPending) return
  panelTraversalPending = true
  window.addEventListener('popstate', () => {
    panelTraversalPending = false
    onBack?.()
  }, { once: true })
  window.history.back()
}

export function usePanelHistory<Value extends string>(name: string, onBack?: () => void) {
  const [value, setValue] = useState<Value | null>(null)
  const current = useRef<Value | null>(null)
  const onBackRef = useRef(onBack)
  useEffect(() => { onBackRef.current = onBack }, [onBack])

  const apply = useCallback((next: Value | null) => {
    current.current = next
    setValue(next)
  }, [])

  useEffect(() => {
    function sync() {
      const entry = currentPanel()
      const next = entry?.name === name ? entry.value as Value : null
      if (current.current !== null && next === null) onBackRef.current?.()
      apply(next)
    }
    sync()
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [name, apply])

  const open = useCallback((next: Value, { replace = false } = {}) => {
    if (panelTraversalPending) return
    const entry = currentPanel()
    const state = { soundlinesPanel: { name, value: next } }
    // Omit the URL so Next.js preserves its router state without navigating.
    if (entry && (replace || entry.name === name)) window.history.replaceState(state, '')
    else window.history.pushState(state, '')
    apply(next)
  }, [name, apply])

  const close = useCallback(() => {
    if (current.current === null) return
    apply(null)
    if (currentPanel()?.name === name) afterClosingHistoryPanel()
  }, [name, apply])

  return { value, open, close }
}
