import { createRoot } from 'react-dom/client'
import favicon from '#media/favicon.svg?url'
import { App } from './App.tsx'
import './styles.css'

const icon = document.createElement('link')
icon.rel = 'icon'
icon.href = favicon
document.head.append(icon)

createRoot(document.getElementById('root')!).render(<App />)
