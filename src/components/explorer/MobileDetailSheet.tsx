import { useTranslations } from 'next-intl'
import { ExpandableSheet } from '../ui/ExpandableSheet.tsx'
import { DetailPanel } from './DetailPanel.tsx'
import { MOBILE_DETAIL_COLLAPSED_OFFSET, MOBILE_DETAIL_HEIGHT } from './mobileDetailSheet.ts'

export function MobileDetailSheet({ onClose, showGenreSample }: { onClose: () => void; showGenreSample: boolean }) {
  const t = useTranslations()
  return (
    <ExpandableSheet
      data-mobile-detail-sheet=""
      height={MOBILE_DETAIL_HEIGHT}
      bottomInset="var(--mobile-navigation-height, env(safe-area-inset-bottom))"
      collapsedOffset={MOBILE_DETAIL_COLLAPSED_OFFSET}
      expandLabel={t('expandDetails')}
      collapseLabel={t('collapseDetails')}
      closeLabel={t('closePanel')}
      onClose={onClose}
    >
      {(expanded) => (
        <DetailPanel
          onClose={onClose}
          showCloseButton={false}
          scrollable={expanded}
          showGenreSample={showGenreSample}
          compactHeader
        />
      )}
    </ExpandableSheet>
  )
}
