import { AudioPreviewPlayer } from './AudioPreviewPlayer.tsx'
import { InfoBadge } from './InfoBadge.tsx'

export function GenreSample({ id, name }: { id: string; name: string }) {
  const slug = id.slice('genre:'.length)
  const url = `${import.meta.env.BASE_URL}genre-previews/${encodeURIComponent(slug)}.m4a`

  return (
    <div className="relative mr-2 shrink-0">
      <AudioPreviewPlayer url={url} label={`${name} preview`} />
      <div className="absolute bottom-0 left-full translate-y-1/4">
        <InfoBadge label="About this audio preview" align="end">
          <a
            href="https://ace-step.github.io/ACE-Step-1.5/"
            target="_blank"
            rel="noreferrer"
            className="rounded-sm text-sky-400 underline underline-offset-2 hover:text-sky-300 focus-visible:outline-2 focus-visible:outline-sky-400"
          >
            ACE-Step
          </a>{' preview · 10 seconds'}
        </InfoBadge>
      </div>
    </div>
  )
}
