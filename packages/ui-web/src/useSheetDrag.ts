import { useDragControls, type PanInfo } from 'motion/react'
import { useSyncExternalStore, type PointerEvent as ReactPointerEvent } from 'react'
import { isSheetSwipe } from './sheetMotion.ts'

const desktopQuery = '(min-width: 48rem)'

function subscribeToDesktop(onChange: () => void) {
  const query = window.matchMedia(desktopQuery)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

export function useIsDesktop() {
  return useSyncExternalStore(subscribeToDesktop, () => window.matchMedia(desktopQuery).matches, () => false)
}

export function useSheetDrag(enabled: boolean, onClose: () => void) {
  const controls = useDragControls()

  return {
    panel: {
      drag: enabled ? 'y' as const : false as const,
      dragControls: controls,
      dragListener: false,
      dragMomentum: false,
      dragConstraints: { top: 0, bottom: 0 },
      dragElastic: { top: 0, bottom: 1 },
      onDragEnd: (_event: MouseEvent | TouchEvent | PointerEvent, { offset, velocity }: PanInfo) => {
        if (isSheetSwipe(offset.y, offset.x, velocity.y)) onClose()
      },
    },
    handle: {
      onPointerDown: enabled ? (event: ReactPointerEvent<HTMLElement>) => {
        if (event.isPrimary && event.button === 0
          && !(event.target instanceof Element && event.target.closest('button, a, input, select, textarea'))) {
          controls.start(event)
        }
      } : undefined,
    },
  }
}
