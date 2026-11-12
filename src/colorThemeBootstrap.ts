export const colorThemeBootstrap = `try {
  const theme = localStorage.getItem('soundlines-theme') === 'light' ? 'light' : 'dark'
  document.documentElement.dataset.theme = theme
  const darkIcon = document.querySelector('link[data-soundlines-favicon="dark"]')
  const lightIcon = document.querySelector('link[data-soundlines-favicon="light"]')
  if (!darkIcon || !lightIcon) throw new Error('Missing Soundlines favicon')
  darkIcon.setAttribute('media', theme === 'dark' ? 'all' : 'not all')
  lightIcon.setAttribute('media', theme === 'light' ? 'all' : 'not all')
} catch (error) {
  console.warn('Unable to initialize the Soundlines theme preference.', error)
}`
