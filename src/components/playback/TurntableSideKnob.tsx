import { Moon, Sun } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ColorTheme } from '../../useColorTheme.ts'
import '../Home.css'

export function TurntableSideKnob({ theme, onClick }: { theme: ColorTheme; onClick: () => void }) {
  const t = useTranslations('homeContent')
  const label = t(theme === 'dark' ? 'switchToLight' : 'switchToDark')
  return (
    <button type="button" className="discovery-turntable-side-toggle" onClick={onClick} aria-pressed={theme === 'light'} aria-label={label} title={label} data-side={theme === 'light' ? 'B' : 'A'}>
      <span className="discovery-knob-face" aria-hidden="true">
        <span className="discovery-knob-dial"><span /></span>
        {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
      </span>
      <span>{t('side')}</span>
    </button>
  )
}
