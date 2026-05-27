import Link from 'next/link'

const sectores = [
  { slug: 'eaa',          nombre: 'Equipo de Animación (EAA)',           emoji: '🎓' },
  { slug: 'economato',    nombre: 'Economato',                           emoji: '🏛' },
  { slug: 'hec',          nombre: 'Hermanos de las Escuelas Cristianas', emoji: '✝️' },
  { slug: 'fls',          nombre: 'Fundación La Salle',                  emoji: '🤝' },
  { slug: 'comunicacion', nombre: 'Comunicación',                        emoji: '📢' },
  { slug: 'secretaria',   nombre: 'Secretaría Distrital',               emoji: '📋' },
]

export default function HomePage() {
  const anio = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-ls-fondo flex flex-col">

      {/* ── Header ────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 py-10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span
              className="text-4xl leading-none select-none"
              style={{ color: '#F58220' }}
              aria-hidden="true"
            >
              ★
            </span>
            <span
              className="text-3xl font-bold tracking-tight"
              style={{ color: '#1B2C65' }}
            >
              La Salle Argentina
            </span>
          </div>
          <p className="text-sm tracking-wide" style={{ color: '#636466' }}>
            Gestión de Vacaciones &middot; {anio}
          </p>
        </div>
      </header>

      {/* ── Main ──────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center px-6 py-14">
        <div className="w-full max-w-3xl">

          <div className="text-center mb-10">
            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: '#1B2C65' }}
            >
              Seleccioná tu sector
            </h1>
            <p className="text-sm" style={{ color: '#636466' }}>
              Elegí el equipo al que pertenecés para ingresar
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {sectores.map((sector) => (
              <Link
                key={sector.slug}
                href={`/${sector.slug}`}
                className="group flex flex-col gap-3 bg-white rounded-xl border border-gray-200 p-6 shadow-sm transition-colors duration-200 hover:bg-ls-azul hover:border-ls-azul"
              >
                <span className="text-3xl select-none" aria-hidden="true">
                  {sector.emoji}
                </span>
                <span
                  className="text-sm font-semibold leading-snug transition-colors duration-200 group-hover:text-white"
                  style={{ color: '#1B2C65' }}
                >
                  {sector.nombre}
                </span>
                <span
                  className="text-sm inline-block transition-all duration-200 group-hover:text-white/80 group-hover:translate-x-1"
                  style={{ color: '#636466' }}
                  aria-hidden="true"
                >
                  →
                </span>
              </Link>
            ))}
          </div>

        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="py-8 text-center border-t border-gray-200">
        <Link
          href="/admin"
          className="text-xs transition-colors hover:text-ls-azul"
          style={{ color: '#636466' }}
        >
          ¿Sos referente o administrador? →
        </Link>
      </footer>

    </div>
  )
}
