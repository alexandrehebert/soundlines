function tween(progress: number, times: number[], values: number[]) {
  if (progress <= times[0]) return values[0]
  for (let i = 1; i < times.length; i++) {
    if (progress <= times[i]) {
      const fraction = (progress - times[i - 1]) / (times[i] - times[i - 1])
      const eased = (1 - Math.cos(fraction * Math.PI)) / 2
      return values[i - 1] + (values[i] - values[i - 1]) * eased
    }
  }
  return values[values.length - 1]
}

export function turntableHintFrame(progress: number) {
  return {
    angle: tween(progress, [.24, .32, .4, .48, .56], [0, -20, 20, -20, 0]),
    grip: tween(progress, [.2, .24, .56, .6], [0, 1, 1, 0]),
    approach: tween(progress, [0, .12], [36, 0]),
    toPlay: tween(progress, [.6, .76], [0, 1]),
    opacity: tween(progress, [0, .12, .9, 1], [0, 1, 1, 0]),
    scale: tween(progress, [0, .24, .56, .76, .83, .9], [1, .9, .9, 1, .82, 1]),
    retreat: tween(progress, [.9, 1], [0, 12]),
  }
}

export type TurntableHintTargets = {
  centerX: number
  centerY: number
  diameter: number
  playX: number
  playY: number
}

export function turntableHintPosition(frame: ReturnType<typeof turntableHintFrame>, targets: TurntableHintTargets) {
  const radians = frame.angle * Math.PI / 180
  const dx = targets.diameter * -.22
  const dy = targets.diameter * -.05
  const scratchX = targets.centerX + dx * Math.cos(radians) - dy * Math.sin(radians)
  const scratchY = targets.centerY + dx * Math.sin(radians) + dy * Math.cos(radians)
  return {
    x: scratchX + (targets.playX - scratchX) * frame.toPlay + frame.approach,
    y: scratchY + (targets.playY - scratchY) * frame.toPlay + frame.approach + frame.retreat,
  }
}
