import { Info } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'

export function InfoBadge({ label, children, align = 'start' }: {
  label: string
  children: ReactNode
  align?: 'start' | 'end'
}) {
  const id = useId()
  const [open, setOpen] = useState(false)

  return (
    <div
      className="relative"
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setOpen(true)
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse' && !event.currentTarget.contains(document.activeElement)) setOpen(false)
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.currentTarget.querySelector('button')?.focus()
          setOpen(false)
          event.stopPropagation()
        }
      }}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={(event) => {
          if (event.nativeEvent instanceof PointerEvent && event.nativeEvent.pointerType === 'mouse') {
            setOpen(true)
          } else {
            setOpen(!open)
          }
        }}
        className="grid size-6 cursor-pointer place-items-center rounded-full bg-[radial-gradient(circle,theme(colors.slate.950)_28%,transparent_72%)] text-slate-300 hover:text-sky-300 focus-visible:outline-2 focus-visible:outline-sky-400"
      >
        <Info size={14} aria-hidden="true" />
      </button>
      <div id={id} hidden={!open} className={`absolute top-full z-10 w-max max-w-60 pt-1 ${align === 'end' ? 'right-0' : 'left-0'}`}>
        <div className="rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 shadow-lg">
          {children}
        </div>
      </div>
    </div>
  )
}
