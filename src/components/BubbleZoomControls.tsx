import type { Ref } from 'react'
import { MAX_BUBBLE_ZOOM, MIN_BUBBLE_ZOOM } from './bubbleViewport.ts'

export function BubbleZoomControls({
  controlsRef,
  zoom,
  onZoom,
}: {
  controlsRef?: Ref<HTMLDivElement>
  zoom: number
  onZoom: (delta: number) => void
}) {
  return (
    <div ref={controlsRef} role="group" aria-label="Bubble zoom"
      className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full border border-slate-700 bg-slate-950/90 p-1 text-xs text-slate-300 shadow-lg backdrop-blur-md">
      <button type="button" aria-label="Zoom out bubbles" disabled={zoom <= MIN_BUBBLE_ZOOM}
        onClick={() => onZoom(-0.1)}
        className="h-11 w-11 rounded-full text-lg hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-cyan-400 disabled:opacity-30">−</button>
      <span className="w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
      <button type="button" aria-label="Zoom in bubbles" disabled={zoom >= MAX_BUBBLE_ZOOM}
        onClick={() => onZoom(0.1)}
        className="h-11 w-11 rounded-full text-lg hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-cyan-400 disabled:opacity-30">+</button>
    </div>
  )
}
