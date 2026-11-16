import { Headphones } from 'lucide-react'

export function PreviewAvailability({ checking }: { checking: boolean }) {
  return (
    <p className="audio-missing">
      <Headphones size={15} aria-hidden="true" />
      {checking ? 'Checking for a preview…' : 'No preview available'}
    </p>
  )
}
