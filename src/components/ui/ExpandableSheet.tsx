import { animate, motion, useIsPresent, useMotionTemplate, useMotionValue, useReducedMotion } from 'motion/react'
import { useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { SheetHeader, sheetSurface } from './SheetHeader.tsx'
import { isSheetSwipe, sheetMotion, sheetSpring } from './sheetMotion.ts'

export function ExpandableSheet({ onClose, height, collapsedOffset, closeLabel, expandLabel, collapseLabel, bottomInset = 'env(safe-area-inset-bottom)', children, ...attributes }: {
  onClose: () => void
  height: number
  collapsedOffset: number
  closeLabel: string
  expandLabel: string
  collapseLabel: string
  bottomInset?: string
  children: (expanded: boolean) => ReactNode
} & Record<`data-${string}`, string>) {
  const [expanded, setExpanded] = useState(false)
  const isPresent = useIsPresent()
  const reduceMotion = useReducedMotion()
  const offset = useMotionValue(0)
  const translate = useMotionTemplate`0 ${offset}px`
  const dragStart = useRef<{ pointerId: number; x: number; y: number; time: number } | null>(null)
  const suppressClick = useRef(false)

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0) return
    if (event.target instanceof Element && event.target.closest('audio, [data-sheet-close]')) return
    if (expanded && (!(event.target instanceof Element)
      || !event.target.closest('[data-sheet-drag-region]'))) return
    offset.stop()
    dragStart.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, time: event.timeStamp }
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = dragStart.current
    if (!start || start.pointerId !== event.pointerId) return
    const delta = event.clientY - start.y
    if (Math.abs(delta) <= 8 || Math.abs(delta) <= Math.abs(event.clientX - start.x)) return
    suppressClick.current = true
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId)
    if (!reduceMotion) offset.set(expanded ? Math.max(0, delta) : delta)
  }

  const resetDrag = () => {
    dragStart.current = null
    animate(offset, 0, reduceMotion ? { duration: 0 } : sheetSpring)
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = dragStart.current
    if (!start || start.pointerId !== event.pointerId) return
    const delta = event.clientY - start.y
    const sideways = event.clientX - start.x
    const elapsed = Math.max(event.timeStamp - start.time, 16)
    const velocity = delta * 1000 / elapsed
    resetDrag()
    if (isSheetSwipe(-delta, sideways, -velocity) && !expanded) {
      suppressClick.current = true
      setExpanded(true)
    } else if (isSheetSwipe(delta, sideways, velocity)) {
      suppressClick.current = true
      if (expanded) setExpanded(false)
      else onClose()
    }
  }

  return (
    <motion.div
      {...attributes}
      data-sheet-preview={isPresent && !expanded ? '' : undefined}
      className={`absolute inset-x-0 bottom-0 z-30 flex flex-col overflow-hidden ${sheetSurface} md:hidden ${expanded ? '' : 'touch-none'}`}
      onPointerDownCapture={() => { suppressClick.current = false }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={resetDrag}
      onLostPointerCapture={(event) => {
        if (event.target === event.currentTarget && dragStart.current) resetDrag()
      }}
      onClickCapture={(event) => {
        const suppress = suppressClick.current
        suppressClick.current = false
        if (!suppress || event.detail === 0) return
        event.preventDefault()
        event.stopPropagation()
      }}
      {...sheetMotion(reduceMotion, expanded ? 0 : `${collapsedOffset * 100}%`)}
      style={{ translate, height: `${height * 100}%`, paddingBottom: bottomInset }}
    >
      <SheetHeader
        closeLabel={closeLabel}
        onClose={onClose}
        handleButton={{
          label: expanded ? collapseLabel : expandLabel,
          onClick: () => setExpanded((current) => !current),
        }}
      />
      <div className="min-h-0 flex-1 overflow-hidden">
        {children(expanded)}
      </div>
    </motion.div>
  )
}
