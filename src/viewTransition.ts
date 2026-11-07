export function observeViewTransition(
  transition: Pick<ViewTransition, 'ready' | 'finished'>,
  cleanup: () => void,
): void {
  void transition.ready.catch((error: unknown) => {
    if (!(error instanceof DOMException && error.name === 'AbortError')) {
      console.warn('Unable to start the view transition.', error)
    }
  })
  void transition.finished.then(cleanup, cleanup)
}
