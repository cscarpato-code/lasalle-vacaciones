'use client'

import { useRouter } from 'next/navigation'

type Props = {
  nombre: string
  sector: string
  logoutRedirect: string
}

export default function LsSidebar({ nombre, sector, logoutRedirect }: Props) {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push(logoutRedirect)
    router.refresh()
  }

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-ls-azul text-white shrink-0">
      {/* Logo */}
      <div className="px-6 py-8 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-ls-naranja text-2xl">★</span>
          <span className="text-xl font-bold tracking-tight">La Salle</span>
        </div>
        <p className="text-xs text-white/50 mt-1 uppercase tracking-widest">
          Sistema de Vacaciones
        </p>
      </div>

      {/* Info del usuario */}
      <div className="px-6 py-6 border-b border-white/10 flex-1">
        <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Usuario</p>
        <p className="font-semibold text-sm leading-snug">{nombre}</p>
        <p className="text-white/60 text-xs mt-0.5">{sector}</p>
      </div>

      {/* Logout */}
      <div className="px-6 py-6">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
