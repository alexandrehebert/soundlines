const MINIMUM_LOADING_MS = 550
const LOADER_FADE_IN_MS = 160
const VINYL_DOCK_MS = 700
let startedAt = performance.now()
let navigationFrame = 0
let navigationTimer: ReturnType<typeof setTimeout> | undefined
let cancelFinish = () => {}

function setLoading(loading: boolean) {
  const overlay = document.getElementById('page-loading')
  if (!overlay) throw new Error('Missing page loading overlay')
  if (loading) delete overlay.dataset.opening
  overlay.dataset.loading = String(loading)
  overlay.setAttribute('aria-hidden', String(!loading))
  document.getElementById('root')?.setAttribute('aria-busy', String(loading))
}

export function transitionPage(update: () => void) {
  cancelFinish()
  cancelAnimationFrame(navigationFrame)
  clearTimeout(navigationTimer)
  startedAt = performance.now()
  setLoading(true)
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // Cover the outgoing view before replacing it.
  navigationFrame = requestAnimationFrame(() => {
    navigationFrame = requestAnimationFrame(() => {
      if (reduceMotion) update()
      else navigationTimer = setTimeout(update, LOADER_FADE_IN_MS)
    })
  })
}

export function finishPageLoading() {
  cancelFinish()
  let frame = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  let animations: Animation[] = []
  const overlay = document.getElementById('page-loading')
  const dismiss = () => {
    const target = document.querySelector<HTMLElement>('#root .discovery-vinyl')
    const vinyl = overlay?.querySelector<HTMLElement>('.page-loading-vinyl')
    const record = vinyl?.querySelector<HTMLElement>('.discovery-vinyl')
    if (!overlay?.hasAttribute('data-opening') || !target || !vinyl || !record
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setLoading(false)
      return
    }

    const from = vinyl.getBoundingClientRect()
    const to = target.getBoundingClientRect()
    const size = target.offsetWidth
    const hero = target.closest<HTMLElement>('.discovery-hero')!
    const bounds = hero.getBoundingClientRect()
    const x = to.left + to.width / 2 - (from.left + from.width / 2)
    const y = to.top + to.height / 2 - (from.top + from.height / 2)
    const options = { duration: VINYL_DOCK_MS, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'forwards' } as const
    overlay.dataset.docking = ''
    animations = [
      overlay.animate([
        { clipPath: 'inset(0px round 0px)', offset: 0 },
        { clipPath: 'inset(0px round 0px)', offset: 0.5 },
        { clipPath: `inset(${Math.max(0, bounds.top)}px ${Math.max(0, window.innerWidth - bounds.right)}px ${Math.max(0, window.innerHeight - bounds.bottom)}px ${Math.max(0, bounds.left)}px round ${getComputedStyle(hero).borderRadius})` },
      ], options),
      vinyl.animate([
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${x}px, ${y}px) scale(${size / from.width})`, opacity: getComputedStyle(target.parentElement!).opacity },
      ], options),
      record.animate([
        { transform: getComputedStyle(record).transform },
        { transform: getComputedStyle(target).transform },
      ], options),
    ]
    timer = setTimeout(() => {
      setLoading(false)
      animations.forEach((animation) => animation.cancel())
    }, VINYL_DOCK_MS)
  }
  const finish = () => {
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        timer = setTimeout(dismiss, Math.max(0, MINIMUM_LOADING_MS - (performance.now() - startedAt)))
      })
    })
  }
  if (document.readyState === 'complete') finish()
  else window.addEventListener('load', finish, { once: true })

  const cancel = () => {
    window.removeEventListener('load', finish)
    cancelAnimationFrame(frame)
    clearTimeout(timer)
    animations.forEach((animation) => animation.cancel())
    if (overlay) delete overlay.dataset.docking
  }
  cancelFinish = cancel
  return cancel
}
