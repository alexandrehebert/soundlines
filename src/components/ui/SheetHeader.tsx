import { X } from 'lucide-react'
import type { PointerEventHandler, ReactNode, Ref } from 'react'

export const sheetSurface = 'max-md:rounded-t-3xl max-md:border-t max-md:border-[var(--home-line,var(--color-slate-700))] max-md:bg-[var(--home-surface,var(--color-slate-950))] max-md:shadow-[0_-1.25rem_3.5rem_rgb(0_0_0_/_0.45)]'

export function SheetHeader({
  onPointerDown, closeLabel, onClose, closeRef, desktopClass = '', actions, handleButton, children,
}: {
  onPointerDown?: PointerEventHandler<HTMLElement>
  closeLabel: string
  onClose: () => void
  closeRef?: Ref<HTMLButtonElement>
  desktopClass?: string
  actions?: ReactNode
  handleButton?: { label: string; onClick: () => void }
  children?: ReactNode
}) {
  const handle = <span aria-hidden="true" className="block h-1 w-10 rounded-full bg-[var(--home-node-line,var(--color-slate-600))]" />
  return (
    <header
      data-sheet-drag-region=""
      onPointerDown={onPointerDown}
      className={`relative flex shrink-0 touch-none select-none items-center gap-2 pl-5 pr-2 max-md:pr-16 ${handleButton ? 'h-12' : 'min-h-12 pb-1.5 pt-[1.1rem]'} ${desktopClass}`}
    >
      {handleButton ? (
        <button
          type="button"
          aria-label={handleButton.label}
          onClick={handleButton.onClick}
          className="absolute left-1/2 top-0 flex h-11 w-16 -translate-x-1/2 touch-none items-start justify-center rounded-full pt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
        >
          {handle}
        </button>
      ) : (
        <span className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 md:hidden">{handle}</span>
      )}
      <div className="min-w-0 flex-1">{children}</div>
      {actions}
      <button
        ref={closeRef}
        type="button"
        data-sheet-close=""
        onClick={onClose}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[color:var(--home-muted,var(--color-slate-400))] transition-colors hover:bg-[var(--home-hover,var(--color-slate-800))] hover:text-[color:var(--home-text,var(--color-slate-200))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 max-md:absolute max-md:top-1 max-md:right-1"
        aria-label={closeLabel}
      >
        <X size={18} aria-hidden="true" />
      </button>
    </header>
  )
}
