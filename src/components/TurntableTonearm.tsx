import { useId } from 'react'
import './Home.css'

export function TurntableTonearm({ active }: { active: boolean }) {
  const gradientId = useId()
  return (
    <div className="discovery-tonearm" data-active={active || undefined} aria-hidden="true">
      <svg viewBox="0 0 360 360">
        <defs>
          <linearGradient id={`${gradientId}-pivot`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop stopColor="var(--home-tonearm-highlight)" />
            <stop offset=".45" stopColor="var(--home-tonearm-metal)" />
            <stop offset="1" stopColor="var(--home-tonearm-shadow)" />
          </linearGradient>
        </defs>
        <circle className="discovery-tonearm-pivot" cx="397" cy="85" r="26" fill={`url(#${gradientId}-pivot)`} stroke="var(--home-tonearm-shadow)" strokeWidth="2" />
        <circle cx="397" cy="85" r="19" fill="var(--home-node)" stroke="var(--home-tonearm-shadow)" strokeWidth="1.5" />
      </svg>
      <div className="discovery-tonearm-swing">
        <svg viewBox="0 0 360 360">
          <defs>
            <linearGradient id={`${gradientId}-metal`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop stopColor="var(--home-tonearm-shadow)" />
              <stop offset=".3" stopColor="var(--home-tonearm-highlight)" />
              <stop offset=".58" stopColor="var(--home-tonearm-metal)" />
              <stop offset="1" stopColor="var(--home-tonearm-shadow)" />
            </linearGradient>
          </defs>
          <path d="M397 85V36" fill="none" stroke="var(--home-tonearm-shadow)" strokeWidth="9" strokeLinecap="round" />
          <path d="M397 85V36" fill="none" stroke={`url(#${gradientId}-metal)`} strokeWidth="5" strokeLinecap="round" />
          <rect x="386" y="34" width="22" height="28" rx="5" fill="var(--home-tonearm-shadow)" />
          <rect x="389" y="37" width="16" height="22" rx="3" fill={`url(#${gradientId}-metal)`} />
          <path d="M397 85c-2 18-8 39-8 57 0 23 18 52 19 73 2 23-11 45-25 66" fill="none" stroke="var(--home-tonearm-shadow)" strokeWidth="10" strokeLinecap="round" />
          <path className="discovery-tonearm-tube" d="M397 85c-2 18-8 39-8 57 0 23 18 52 19 73 2 23-11 45-25 66" fill="none" stroke={`url(#${gradientId}-metal)`} strokeWidth="6" strokeLinecap="round" />
          <path d="M395 91c-2 18-8 35-8 51 0 23 18 52 19 73 2 23-11 44-25 64" fill="none" stroke="var(--home-tonearm-highlight)" strokeWidth="1.25" strokeLinecap="round" opacity=".65" />
          <g transform="translate(383 280) rotate(30)">
            <rect x="-5" y="-2" width="10" height="14" rx="2" fill={`url(#${gradientId}-metal)`} />
            <path d="M-7 9h14l2 9H-9Z" fill="var(--home-tonearm-shadow)" stroke="var(--home-tonearm-metal)" strokeWidth="1.5" />
            <path d="M-10 18h20L9 53l-3 6H-6l-3-6Z" fill="var(--home-node)" stroke="var(--home-tonearm-metal)" strokeWidth="1.5" />
            <circle cx="0" cy="26" r="2.5" fill="var(--home-tonearm-metal)" />
            <circle cx="0" cy="36" r="2.5" fill="var(--home-tonearm-metal)" />
            <circle cx="0" cy="46" r="2.5" fill="var(--home-tonearm-metal)" />
            <path d="M-5 59h10l-2 5h-6Z" fill="var(--home-tonearm-shadow)" />
            <path className="discovery-tonearm-stylus" d="M0 64v3" stroke="var(--home-tonearm-highlight)" strokeWidth="1.5" strokeLinecap="round" />
          </g>
          <circle cx="397" cy="85" r="8" fill={`url(#${gradientId}-metal)`} stroke="var(--home-tonearm-shadow)" strokeWidth="1.5" />
          <circle cx="397" cy="85" r="2.5" fill="var(--home-tonearm-shadow)" />
        </svg>
      </div>
    </div>
  )
}
