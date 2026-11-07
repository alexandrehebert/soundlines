'use client'

import { useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'
import { observeViewTransition } from './viewTransition.ts'

export type ColorTheme = 'dark' | 'light'
const THEME_EVENT = 'soundlines-theme-change'

function snapshot(): ColorTheme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

let restoreTransitions: (() => void) | undefined

// Theme colors must swap in one frame; hover color transitions would otherwise fade controls between themes.
function applyTheme(theme: ColorTheme) {
  const root = document.documentElement
  restoreTransitions?.()
  root.dataset.themeSwitching = ''
  root.dataset.theme = theme
  if (typeof window.requestAnimationFrame !== 'function') {
    delete root.dataset.themeSwitching
    return
  }
  let frame = window.requestAnimationFrame(() => {
    frame = window.requestAnimationFrame(() => restoreTransitions?.())
  })
  restoreTransitions = () => {
    window.cancelAnimationFrame(frame)
    delete root.dataset.themeSwitching
    restoreTransitions = undefined
  }
}

function subscribe(notify: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== 'soundlines-theme' && event.key !== null) return
    applyTheme(event.newValue === 'light' ? 'light' : 'dark')
    notify()
  }
  window.addEventListener(THEME_EVENT, notify)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(THEME_EVENT, notify)
    window.removeEventListener('storage', onStorage)
  }
}

const THEME_TRANSITION_CLASS = 'soundlines-theme-transition'

// Crossfades the whole page between themes so every surface changes together.
function transitionTheme(update: () => void) {
  const root = document.documentElement
  if (!document.startViewTransition || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    update()
    return
  }
  root.classList.add(THEME_TRANSITION_CLASS)
  const transition = document.startViewTransition(() => flushSync(update))
  const cleanup = () => root.classList.remove(THEME_TRANSITION_CLASS)
  observeViewTransition(transition, cleanup)
}

export function useColorTheme() {
  const theme = useSyncExternalStore(subscribe, snapshot, (): ColorTheme => 'dark')
  const toggleTheme = () => {
    const next = snapshot() === 'dark' ? 'light' : 'dark'
    transitionTheme(() => {
      applyTheme(next)
      window.dispatchEvent(new Event(THEME_EVENT))
    })
    try {
      localStorage.setItem('soundlines-theme', next)
    } catch (error) {
      console.warn('Unable to save the Soundlines theme preference.', error)
    }
  }
  return { theme, toggleTheme }
}
