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

export const TURNTABLE_HINTS = ['scratch-play', 'baby-scratch-play', 'play-backspin', 'play-scratch'] as const
export type TurntableHintScenario = typeof TURNTABLE_HINTS[number]

export function turntableHintFrame(progress: number, scenario: TurntableHintScenario = 'scratch-play') {
  const playFirst = scenario === 'play-backspin' || scenario === 'play-scratch'
  const scratchProgress = playFirst ? (progress - .48) / .36 : (progress - .24) / .32
  const angle = scenario === 'baby-scratch-play'
    ? tween(scratchProgress, [0, .2, .4, .6, .8, 1], [0, -12, 12, -12, 12, 0])
    : scenario === 'play-backspin'
      ? tween(scratchProgress, [0, .5, 1], [0, -105, 0])
      : scenario === 'play-scratch'
        ? tween(scratchProgress, [0, .25, .5, .75, 1], [0, 28, -28, 15, 0])
        : tween(scratchProgress, [0, .25, .5, .75, 1], [0, -20, 20, -20, 0])
  return {
    angle,
    grip: playFirst
      ? tween(progress, [.44, .48, .84, .88], [0, 1, 1, 0])
      : tween(progress, [.2, .24, .56, .6], [0, 1, 1, 0]),
    approach: tween(progress, [0, .12], [36, 0]),
    toPlay: playFirst ? tween(progress, [.28, .44], [1, 0]) : tween(progress, [.6, .76], [0, 1]),
    opacity: tween(progress, [0, .12, .9, 1], [0, 1, 1, 0]),
    scale: playFirst
      ? tween(progress, [0, .12, .2, .28, .44, .48, .84, .88], [1, 1, .82, 1, 1, .9, .9, 1])
      : tween(progress, [0, .24, .56, .76, .83, .9], [1, .9, .9, 1, .82, 1]),
    playPulse: playFirst
      ? tween(progress, [0, .12, .2, .28, 1], [0, 0, 1, 0, 0])
      : tween(progress, [0, .76, .83, .9, 1], [0, 0, 1, 0, 0]),
    retreat: tween(progress, [.9, 1], [0, 12]),
  }
}

function hintPause() {
  return 10000 + Math.random() * 6000
}

export function scheduleTurntableHints(start: (scenario: TurntableHintScenario) => () => void) {
  let timer: ReturnType<typeof setTimeout> | undefined
  let stop: (() => void) | undefined
  let previous: TurntableHintScenario | undefined
  let disposed = false

  const pause = () => {
    clearTimeout(timer)
    stop?.()
    stop = undefined
  }
  const schedule = (delay: number) => {
    pause()
    if (disposed) return
    timer = setTimeout(() => {
      const choices = TURNTABLE_HINTS.filter((scenario) => scenario !== previous)
      previous = choices[Math.floor(Math.random() * choices.length)]
      stop = start(previous)
      timer = setTimeout(() => schedule(hintPause()), 7000)
    }, delay)
  }
  return {
    resume: () => schedule(previous ? hintPause() : 2000),
    restart: () => schedule(hintPause()),
    pause,
    dispose: () => { pause(); disposed = true },
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
