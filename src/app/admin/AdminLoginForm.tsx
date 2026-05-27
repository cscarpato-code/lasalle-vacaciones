'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        router.push('/admin/dashboard')
      } else {
        const data = await res.json()
        setError(data.error ?? 'Contraseña incorrecta')
        setLoading(false)
      }
    } catch {
      setError('Error al conectar con el servidor. Intentá de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ls-fondo flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[380px]">

        <div className="bg-white rounded-[16px] shadow-lg overflow-hidden">

          {/* Header */}
          <div className="px-8 py-8" style={{ backgroundColor: '#1B2C65' }}>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="text-2xl leading-none select-none" style={{ color: '#F58220' }} aria-hidden="true">★</span>
              <span className="text-white text-xl font-bold tracking-tight">La Salle</span>
            </div>
            <p className="text-sm font-semibold" style={{ color: '#F58220' }}>
              Panel de Administración
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8 flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-ls-azul">
                Contraseña de administrador
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-shadow focus:border-ls-azul focus:ring-2 focus:ring-ls-azul/20 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>

            {error && (
              <div
                className="rounded-lg px-3.5 py-3 text-sm"
                style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}
                role="alert"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed hover:bg-ls-azul-medio"
              style={{ backgroundColor: '#1B2C65' }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Ingresando…
                </>
              ) : (
                'Ingresar al panel'
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: '#636466' }}>
          Acceso exclusivo para referentes y administración
        </p>
      </div>
    </div>
  )
}
