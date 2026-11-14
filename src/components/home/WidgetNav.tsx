import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function WidgetNav({ nextLabel, onPrevious, onNext, previousDisabled = false }: {
  nextLabel: string
  onPrevious: () => void
  onNext: () => void
  previousDisabled?: boolean
}) {
  const tHome = useTranslations('homeContent')
  return (
    <div className="discovery-widget-nav">
      <button type="button" className="discovery-widget-action" onClick={onPrevious} disabled={previousDisabled}>
        <ArrowLeft size={16} aria-hidden="true" /> {tHome('previous')}
      </button>
      <button type="button" className="discovery-widget-action" onClick={onNext}>
        {nextLabel} <ArrowRight size={16} aria-hidden="true" />
      </button>
    </div>
  )
}
