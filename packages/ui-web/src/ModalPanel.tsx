import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { SheetHeader, sheetSurface } from './SheetHeader.tsx'
import { useIsDesktop, useSheetDrag } from './useSheetDrag.ts'
import { sheetMotion } from './sheetMotion.ts'
import { trapTabFocus } from './trapTabFocus.ts'

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
  const descriptionId = useId()
  const mobile = !useIsDesktop()
  const reduceMotion = useReducedMotion()
  const drag = useSheetDrag(mobile, onClose)
  const panel = useRef<HTMLElement>(null)
  const close = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const initial = panel.current?.querySelector<HTMLElement>('[data-panel-initial-focus]') ?? close.current
    initial?.focus({ preventScroll: true })
    return () => previous?.focus()
  }, [])

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }
    trapTabFocus(event)
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden md:items-center md:p-6"
    >
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-[rgb(3_4_12_/_0.6)] md:backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.2 }}
        onClick={onClose}
      />
      <motion.section
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        {...drag.panel}
        onKeyDown={onKeyDown}
        className={`flex max-h-[90dvh] w-full flex-col overflow-hidden md:border md:border-slate-700 md:bg-slate-950 md:shadow-2xl md:shadow-black/60 md:max-h-[85dvh] md:rounded-2xl relative pb-[env(safe-area-inset-bottom)] md:pb-0 ${sheetSurface} ${wide ? 'md:max-w-6xl' : 'md:max-w-3xl'}`}
        {...(mobile ? sheetMotion(reduceMotion) : {
          initial: reduceMotion ? false : { y: 24, opacity: 0, scale: 0.98 },
          animate: { y: 0, opacity: 1, scale: 1 },
          exit: { y: 24, opacity: 0, scale: 0.98 },
          transition: reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 34 },
        })}
        onClick={(event) => event.stopPropagation()}
      >
        <SheetHeader
          {...drag.handle}
          closeLabel={closeLabel}
          onClose={onClose}
          closeRef={close}
          actions={actions}
          desktopClass="border-b border-slate-800 md:touch-auto md:select-auto md:px-5 md:pb-3 md:pt-4"
        >
          <h2 id={titleId} className="text-base font-bold text-white">{title}</h2>
          {description && <p id={descriptionId} className="mt-0.5 text-xs text-slate-500">{description}</p>}
        </SheetHeader>
        {children}
      </motion.section>
    </motion.div>
  )
}
