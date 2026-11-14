export const sheetSpring = { type: 'spring', stiffness: 360, damping: 36 } as const

export function sheetMotion(reduceMotion: boolean | null, position: number | string = 0) {
  return {
    initial: reduceMotion ? false as const : { y: '100%' },
    animate: { y: position },
    exit: { y: '100%' },
    transition: reduceMotion ? { duration: 0 } : sheetSpring,
  }
}

export function isSheetSwipe(distance: number, sideways: number, velocity: number) {
  return distance > Math.abs(sideways) && (distance > 120 || (distance > 24 && velocity > 600))
}
