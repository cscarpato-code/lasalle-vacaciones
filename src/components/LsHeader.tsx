type Props = {
  titulo: string
}

export default function LsHeader({ titulo }: Props) {
  return (
    <header className="bg-ls-azul text-white px-6 h-16 flex items-center gap-4 shrink-0">
      <div className="flex items-center gap-1.5">
        <span className="text-ls-naranja text-lg">★</span>
        <span className="font-bold text-base tracking-tight">La Salle</span>
      </div>
      <span className="w-px h-5 bg-white/25" aria-hidden="true" />
      <h1 className="text-sm font-medium text-white/90">{titulo}</h1>
    </header>
  )
}
