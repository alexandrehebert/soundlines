import { ArrowRight, ArrowUpRight, Disc3, Headphones } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useExplorer } from '../../ExplorerContext.ts'
import { hasGenrePreview } from '../../data/genrePreviews.ts'
import type { GraphNode } from '../../graph/types.ts'
import { EntryLink } from '../navigation/ExplorerLinks.tsx'
import { GenreSample } from '../playback/GenreSample.tsx'
import { JukeboxPlayer } from '../playback/Jukebox.tsx'
import { BodyPortal } from '../ui/BodyPortal.tsx'
import { usePanelHistory } from '../ui/usePanelHistory.ts'
import { ModalPanel } from '../ui/ModalPanel.tsx'
import type { ScrollReveal } from './homeReveal.ts'
import { WidgetNav } from './WidgetNav.tsx'

const LISTENING_PICKS = ['genre:bossa-nova', 'genre:acid-jazz', 'genre:detroit-techno'] as const

function shuffled<T>(items: readonly T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function ListeningWidget({ scrollReveal }: { scrollReveal: ScrollReveal }) {
  const { index } = useExplorer()
  const tHome = useTranslations('homeContent')
  const jukebox = useTranslations('jukebox')
  const jukeboxPanel = usePanelHistory('jukebox')
  const jukeboxOpen = jukeboxPanel.value !== null
  const genres = useMemo(() => {
    const all = [...index.nodeById.values()].filter((node) => node.type === 'genre' && hasGenrePreview(node.id))
    const curated = LISTENING_PICKS.map((id) => index.nodeById.get(id)).filter((node): node is GraphNode => node?.type === 'genre')
    return { all, curated }
  }, [index])
  // `played` keeps every heard genre so “previous” can walk back; `upcoming` is refilled with a fresh shuffle.
  const [booth, setBooth] = useState(() => {
    const [first, ...rest] = genres.curated
    return { played: first ? [first] : [], position: 0, upcoming: rest }
  })
  const pick = booth.played[booth.position]
  if (!pick) return null

  const previous = () => setBooth((current) => ({ ...current, position: Math.max(0, current.position - 1) }))
  const next = () => setBooth((current) => {
    if (current.position + 1 < current.played.length) return { ...current, position: current.position + 1 }
    let upcoming = current.upcoming
    if (upcoming.length === 0) {
      const recent = new Set(current.played.slice(-LISTENING_PICKS.length).map((node) => node.id))
      const round = shuffled(genres.all)
      upcoming = [...round.filter((node) => !recent.has(node.id)), ...round.filter((node) => recent.has(node.id))]
    }
    const [following, ...rest] = upcoming
    return { played: [...current.played, following], position: current.played.length, upcoming: rest }
  })

  return (
    <motion.section {...scrollReveal} className="discovery-widget discovery-listening-card" aria-labelledby="listening-heading">
      <div className="discovery-widget-heading">
        <h3 id="listening-heading"><Headphones size={19} aria-hidden="true" /> {tHome('listeningBooth')}</h3>
      </div>
      <div className="discovery-listening">
        <GenreSample key={pick.id} id={pick.id} name={pick.name} />
        <div aria-live="polite">
          <EntryLink node={pick} className="discovery-listening-link">
            {pick.name} <ArrowUpRight size={15} aria-hidden="true" />
          </EntryLink>
        </div>
      </div>
      <p className="discovery-note">{tHome('listeningDescription')}</p>
      {genres.all.length > 1 && (
        <WidgetNav nextLabel={tHome('nextSound')} onPrevious={previous} onNext={next} previousDisabled={booth.position === 0} />
      )}
      <button type="button" className="discovery-widget-action" aria-haspopup="dialog"
        aria-expanded={jukeboxOpen} onClick={() => jukeboxPanel.open('open')}>
        <Disc3 size={17} aria-hidden="true" /> {jukebox('open')} <ArrowRight size={15} aria-hidden="true" />
      </button>
      <BodyPortal>
        <div className="discovery contents">
          <AnimatePresence>
            {jukeboxOpen && (
              <ModalPanel
                title={jukebox('title')}
                description={jukebox('description')}
                closeLabel={jukebox('close')}
                onClose={jukeboxPanel.close}
                wide
              >
                <JukeboxPlayer embedded />
              </ModalPanel>
            )}
          </AnimatePresence>
        </div>
      </BodyPortal>
    </motion.section>
  )
}
