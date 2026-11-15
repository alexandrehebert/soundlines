type Stop = () => void

let current: Stop | null = null

/** Registers `stop` as the only active player, stopping the previous one. */
export function claimPlayback(stop: Stop) {
  const previous = current
  current = stop
  if (previous && previous !== stop) previous()
}

export function releasePlayback(stop: Stop) {
  if (current === stop) current = null
}
