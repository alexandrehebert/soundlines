export function OpenDataSectionHeading({ id, title, description }: {
  id: string
  title: string
  description: string
}) {
  return (
    <>
      <h2 id={id} className="text-2xl font-bold tracking-tight">{title}</h2>
      <p className="mt-3 max-w-3xl leading-relaxed text-slate-400">{description}</p>
    </>
  )
}
