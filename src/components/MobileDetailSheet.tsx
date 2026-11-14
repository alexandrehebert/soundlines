import { X } from 'lucide-react'
import { motion } from 'motion/react'
import { useRef, useState, type PointerEvent } from 'react'
import { useTranslations } from 'next-intl'
import { DetailPanel } from './DetailPanel.tsx'
import { MOBILE_DETAIL_COLLAPSED_OFFSET, MOBILE_DETAIL_HEIGHT } from './mobileDetailSheet.ts'

export function MobileDetailSheet({ onClose, showGenreSample }: { onClose: () => void; showGenreSample: boolean }) {
  const t = useTranslations()
  const [expanded, setExpanded] = useState(false)
  const dragStart = useRef<{ pointerId: number; x: number; y: number } | null>(null)
  const suppressClick = useRef(false)

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0) return
    if (event.target instanceof Element && event.target.closest('audio')) return
    if (expanded && (!(event.target instanceof Element)
      || !event.target.closest('[data-detail-drag-region]'))) return
    dragStart.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY }
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = dragStart.current
    if (!start || start.pointerId !== event.pointerId) return
    if (Math.abs(event.clientY - start.y) > 40
      && Math.abs(event.clientY - start.y) > Math.abs(event.clientX - start.x)) {
      suppressClick.current = true
      event.currentTarget.setPointerCapture(event.pointerId)
    }
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = dragStart.current
    if (!start || start.pointerId !== event.pointerId) return
    dragStart.current = null
    const delta = event.clientY - start.y
    if (Math.abs(delta) <= 40 || Math.abs(delta) <= Math.abs(event.clientX - start.x)) return
    suppressClick.current = true
    if (delta < -40) setExpanded(true)
    if (delta > 40) {
      if (expanded) setExpanded(false)
      else onClose()
    }
  }

  return (
    <motion.div
      data-mobile-detail-sheet=""
      className={`absolute inset-x-0 bottom-0 z-30 flex flex-col overflow-hidden rounded-t-3xl border-t border-slate-700 bg-slate-950 shadow-2xl shadow-black/60 md:hidden ${expanded ? '' : 'touch-none'}`}
      onPointerDownCapture={() => { suppressClick.current = false }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => { dragStart.current = null }}
      onLostPointerCapture={(event) => {
        if (event.target === event.currentTarget) dragStart.current = null
      }}
      onClickCapture={(event) => {
        const suppress = suppressClick.current
        suppressClick.current = false
        if (!suppress || event.detail === 0) return
        event.preventDefault()
        event.stopPropagation()
      }}
      initial={{ y: '100%' }}
      animate={{ y: expanded ? 0 : `${MOBILE_DETAIL_COLLAPSED_OFFSET * 100}%` }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 34 }}
      style={{ height: `${MOBILE_DETAIL_HEIGHT * 100}%`, paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div data-detail-drag-region="" className="relative flex shrink-0 touch-none items-center justify-center py-1">
        <button
          type="button"
          className="flex h-11 w-16 touch-none items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
          aria-label={t(expanded ? 'collapseDetails' : 'expandDetails')}
          onClick={() => setExpanded((current) => !current)}
        >
          <span className="h-1 w-10 rounded-full bg-slate-600" />
        </button>
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onClose}
          className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-800 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
          aria-label={t('closePanel')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <DetailPanel onClose={onClose} showCloseButton={false} scrollable={expanded} showGenreSample={showGenreSample} />
      </div>
    </motion.div>
  )
}
