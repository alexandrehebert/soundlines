import { X } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'

export function ModalPanel({ title, description, actions, closeLabel, onClose, wide, children }: {
  title: string
  description?: ReactNode
  actions?: ReactNode
  closeLabel: string
  onClose: () => void
  wide?: boolean
  children: ReactNode
}) {
  const titleId = useId()
  const panel = useRef<HTMLElement>(null)
  const close = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const initial = panel.current?.querySelector<HTMLElement>('[data-panel-initial-focus]') ?? close.current
    initial?.focus()
    return () => previous?.focus()
  }, [])

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key !== 'Tab') return
    const focusable = panel.current?.querySelectorAll<HTMLElement>(
      'button:not(:disabled):not([tabindex="-1"]), a[href], input:not(:disabled)',
    )
    if (!focusable?.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center md:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.section
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
        className={`flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-slate-700 bg-slate-950 shadow-2xl shadow-black/60 md:max-h-[85dvh] md:rounded-2xl ${wide ? 'md:max-w-6xl' : 'md:max-w-3xl'}`}
        initial={{ y: 24, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 24, opacity: 0, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-800 px-5 pb-3 pt-4">
          <div>
            <h2 id={titleId} className="text-base font-bold text-white">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {actions}
            <button
              ref={close}
              type="button"
              onClick={onClose}
              className="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
              aria-label={closeLabel}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </header>
        {children}
      </motion.section>
    </motion.div>
  )
}
