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

export function cancelPageTransition() {
  cancelAnimationFrame(navigationFrame)
  clearTimeout(navigationTimer)
}

export function transitionPage(update: () => void) {
  cancelFinish()
  cancelPageTransition()
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
    const side = document.documentElement.dataset.theme === 'light' ? 'b' : 'a'
    const target = document.querySelector<HTMLElement>(`#root .discovery-record-face-${side} .discovery-vinyl`)
    const destination = target?.closest<HTMLElement>('.discovery-record-perspective')
    const vinyl = overlay?.querySelector<HTMLElement>('.page-loading-vinyl')
    const record = vinyl?.querySelector<HTMLElement>('.discovery-vinyl')
    if (!overlay?.hasAttribute('data-opening') || !target || !destination || !vinyl || !record
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setLoading(false)
      return
    }

    const from = vinyl.getBoundingClientRect()
    const size = target.offsetWidth
    // Render the loader record at the landing size so grooves, borders and the icon match exactly when handed off.
    vinyl.style.width = `${size}px`
    const resized = vinyl.getBoundingClientRect()
    const hero = target.closest<HTMLElement>('.discovery-hero')!
    const centerX = resized.left + resized.width / 2
    const centerY = resized.top + resized.height / 2
    const startX = from.left + from.width / 2 - centerX
    const startY = from.top + from.height / 2 - centerY
    const startRotation = getComputedStyle(record).transform
    const options = { duration: VINYL_DOCK_MS, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'forwards' } as const
    const dockingKeyframes = (): Keyframe[][] => {
      // The perspective container stays centered even if a record face is flipping.
      const to = destination.getBoundingClientRect()
      const bounds = hero.getBoundingClientRect()
      // Match the hero's padding-box clip, inside its border.
      const heroStyle = getComputedStyle(hero)
      const border = {
        top: parseFloat(heroStyle.borderTopWidth) || 0,
        right: parseFloat(heroStyle.borderRightWidth) || 0,
        bottom: parseFloat(heroStyle.borderBottomWidth) || 0,
        left: parseFloat(heroStyle.borderLeftWidth) || 0,
      }
      const x = to.left + to.width / 2 - centerX
      const y = to.top + to.height / 2 - centerY
      return [[
        { clipPath: 'inset(0px round 0px)', offset: 0 },
        { clipPath: 'inset(0px round 0px)', offset: 0.5 },
        { clipPath: `inset(${Math.max(0, bounds.top + border.top)}px ${Math.max(0, window.innerWidth - bounds.right + border.right)}px ${Math.max(0, window.innerHeight - bounds.bottom + border.bottom)}px ${Math.max(0, bounds.left + border.left)}px round ${Math.max(0, parseFloat(heroStyle.borderRadius) - border.left)}px)` },
      ], [
        { transform: `translate(${startX}px, ${startY}px) scale(${from.width / size})`, opacity: 1 },
        { transform: `translate(${x}px, ${y}px) scale(1)`, opacity: getComputedStyle(target.closest('.discovery-record')!).opacity },
      ], [
        { transform: startRotation },
        { transform: getComputedStyle(target).transform },
      ]]
    }
    overlay.dataset.docking = ''
    const initialKeyframes = dockingKeyframes()
    animations = [overlay, vinyl, record].map((element, index) =>
      element.animate(initialKeyframes[index], options))
    const trackDestination = () => {
      const keyframes = dockingKeyframes()
      animations.forEach((animation, index) => {
        if (animation.effect instanceof KeyframeEffect) animation.effect.setKeyframes(keyframes[index])
      })
      frame = requestAnimationFrame(trackDestination)
    }
    frame = requestAnimationFrame(trackDestination)
    timer = setTimeout(() => {
      cancelAnimationFrame(frame)
      setLoading(false)
      animations.forEach((animation) => animation.cancel())
      vinyl.style.removeProperty('width')
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
    overlay?.querySelector<HTMLElement>('.page-loading-vinyl')?.style.removeProperty('width')
    if (overlay) delete overlay.dataset.docking
  }
  cancelFinish = cancel
  return cancel
}
