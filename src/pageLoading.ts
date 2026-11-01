const MINIMUM_LOADING_MS = 550
let startedAt = performance.now()
let navigationFrame = 0
let cancelFinish = () => {}

function setLoading(loading: boolean) {
  const overlay = document.getElementById('page-loading')
  if (!overlay) throw new Error('Missing page loading overlay')
  overlay.dataset.loading = String(loading)
  overlay.setAttribute('aria-hidden', String(!loading))
  document.getElementById('root')?.setAttribute('aria-busy', String(loading))
}

export function transitionPage(update: () => void) {
  cancelFinish()
  cancelAnimationFrame(navigationFrame)
  startedAt = performance.now()
  setLoading(true)
  // Give the overlay a painted frame before building the next view.
  navigationFrame = requestAnimationFrame(() => {
    navigationFrame = requestAnimationFrame(update)
  })
}

export function finishPageLoading() {
  cancelFinish()
  let frame = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  const finish = () => {
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        timer = setTimeout(() => setLoading(false), Math.max(0, MINIMUM_LOADING_MS - (performance.now() - startedAt)))
      })
    })
  }
  if (document.readyState === 'complete') finish()
  else window.addEventListener('load', finish, { once: true })

  const cancel = () => {
    window.removeEventListener('load', finish)
    cancelAnimationFrame(frame)
    clearTimeout(timer)
  }
  cancelFinish = cancel
  return cancel
}
