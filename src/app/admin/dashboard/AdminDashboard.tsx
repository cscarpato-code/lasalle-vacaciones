'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import LsBadge from '@/components/LsBadge'
import { getSidebarData, type SidebarData } from './actions'

export type SolicitudRow = {
  id: string
  empleado_id: string
  empleado_nombre: string
  empleado_email: string
  empleado_dias_totales: number
  sector_id: string
  sector_nombre: string
  sector_referente: string
  fecha_inicio: string
  fecha_fin: string
  dias: number
  tipo: string
  estado: 'pendiente' | 'aprobada' | 'rechazada'
  notas: string | null
  created_at: string
}

type Props = {
  solicitudes: SolicitudRow[]
  sectores: { id: string; nombre: string }[]
  anio: number
}

const TRAMOS_MAX = 3
const ESTADO_ORDER = { pendiente: 0, aprobada: 1, rechazada: 2 } as const

function ff(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function ffShort(iso: string) {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

export default function AdminDashboard({ solicitudes: initial, sectores, anio }: Props) {
  const router = useRouter()
  const [rows, setRows] = useState<SolicitudRow[]>(initial)
  const [sectorFilter, setSectorFilter] = useState('all')
  const [estadoFilter, setEstadoFilter] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sidebarData, setSidebarData] = useState<SidebarData | null>(null)
  const [loadingSidebar, setLoadingSidebar] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const selectedRow = rows.find((r) => r.id === selectedId) ?? null

  const filtered = rows
    .filter((r) => sectorFilter === 'all' || r.sector_id === sectorFilter)
    .filter((r) => estadoFilter === 'all' || r.estado === estadoFilter)
    .sort((a, b) => {
      const diff = ESTADO_ORDER[a.estado] - ESTADO_ORDER[b.estado]
      return diff !== 0 ? diff : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  async function handleRowClick(row: SolicitudRow) {
    if (selectedId === row.id) {
      setSelectedId(null)
      setSidebarData(null)
      return
    }
    setSelectedId(row.id)
    setLoadingSidebar(true)
    setSidebarData(null)
    try {
      const data = await getSidebarData(row.id, row.empleado_id, anio)
      setSidebarData(data)
    } finally {
      setLoadingSidebar(false)
    }
  }

  async function handleAction(id: string, accion: 'aprobar' | 'rechazar') {
    setActionLoading(id)
    setActionError(null)
    const prev = rows.find((r) => r.id === id)?.estado ?? 'pendiente'
    const nuevoEstado = accion === 'aprobar' ? 'aprobada' : 'rechazada'

    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, estado: nuevoEstado } : r)))

    const res = await fetch(`/api/solicitudes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion }),
    })

    if (!res.ok) {
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, estado: prev } : r)))
      setActionError('No se pudo procesar la acción. Intentá de nuevo.')
    }
    setActionLoading(null)
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin')
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#F5F6FA' }}>

      {/* ── Header ── */}
      <header className="bg-ls-azul text-white px-6 h-16 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-ls-naranja text-lg">★</span>
            <span className="font-bold text-base tracking-tight">La Salle</span>
          </div>
          <span className="w-px h-5 bg-white/25" />
          <h1 className="text-sm font-medium text-white/90">Panel de Administración</h1>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Cerrar sesión
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">

        {/* ── Main ── */}
        <main className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

          {/* Filters */}
          <div className="flex flex-wrap items-end gap-4">
            <Field label="Sector">
              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className={selectCls}
              >
                <option value="all">Todos los sectores</option>
                {sectores.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </Field>

            <Field label="Estado">
              <select
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                className={selectCls}
              >
                <option value="all">Todos</option>
                <option value="pendiente">Pendientes</option>
                <option value="aprobada">Aprobadas</option>
                <option value="rechazada">Rechazadas</option>
              </select>
            </Field>

            <Field label="Año">
              <select
                value={anio}
                onChange={(e) => router.push(`?anio=${e.target.value}`)}
                className={selectCls}
              >
                {[anio - 1, anio, anio + 1].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </Field>

            <span className="text-xs text-ls-gris self-end pb-2.5">
              {filtered.length} solicitud{filtered.length !== 1 ? 'es' : ''}
            </span>
          </div>

          {/* Error */}
          {actionError && (
            <div className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }} role="alert">
              {actionError}
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-sm text-ls-gris">
                No hay solicitudes para los filtros seleccionados
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs font-semibold text-ls-gris">
                      <th className="text-left px-4 py-3">Empleado</th>
                      <th className="text-left px-4 py-3">Sector</th>
                      <th className="text-left px-4 py-3">Solicitado</th>
                      <th className="text-left px-4 py-3">Desde</th>
                      <th className="text-left px-4 py-3">Hasta</th>
                      <th className="text-left px-4 py-3">Días</th>
                      <th className="text-left px-4 py-3">Estado</th>
                      <th className="text-left px-4 py-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((row) => {
                      const isSelected = selectedId === row.id
                      const isLoadingAction = actionLoading === row.id
                      return (
                        <tr
                          key={row.id}
                          onClick={() => handleRowClick(row)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                            {row.empleado_nombre}
                          </td>
                          <td className="px-4 py-3 text-ls-gris whitespace-nowrap">{row.sector_nombre}</td>
                          <td className="px-4 py-3 text-ls-gris whitespace-nowrap">{ffShort(row.created_at)}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{ff(row.fecha_inicio)}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{ff(row.fecha_fin)}</td>
                          <td className="px-4 py-3">{row.dias}</td>
                          <td className="px-4 py-3">
                            <LsBadge estado={row.estado} />
                          </td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            {row.estado === 'pendiente' && (
                              <div className="flex items-center gap-2">
                                <ActionBtn
                                  variant="approve"
                                  disabled={isLoadingAction}
                                  onClick={() => handleAction(row.id, 'aprobar')}
                                />
                                <ActionBtn
                                  variant="reject"
                                  disabled={isLoadingAction}
                                  onClick={() => handleAction(row.id, 'rechazar')}
                                />
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

        {/* ── Sidebar ── */}
        {selectedId && (
          <aside className="w-[380px] shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
            {loadingSidebar ? (
              <div className="flex items-center justify-center h-40 text-sm text-ls-gris">
                Cargando…
              </div>
            ) : selectedRow && sidebarData ? (
              <SidebarPanel
                row={selectedRow}
                data={sidebarData}
                actionLoading={actionLoading}
                onAction={handleAction}
                onClose={() => { setSelectedId(null); setSidebarData(null) }}
              />
            ) : null}
          </aside>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-ls-gris uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

const selectCls =
  'rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-ls-azul focus:ring-2 focus:ring-ls-azul/20 bg-white min-w-[160px]'

function ActionBtn({
  variant,
  disabled,
  onClick,
}: {
  variant: 'approve' | 'reject'
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      style={
        variant === 'approve'
          ? { backgroundColor: '#DCFCE7', color: '#166534' }
          : { backgroundColor: '#FEE2E2', color: '#991B1B' }
      }
    >
      {variant === 'approve' ? '✓ Aprobar' : '✗ Rechazar'}
    </button>
  )
}

type SidebarProps = {
  row: SolicitudRow
  data: SidebarData
  actionLoading: string | null
  onAction: (id: string, accion: 'aprobar' | 'rechazar') => void
  onClose: () => void
}

function SidebarPanel({ row, data, actionLoading, onAction, onClose }: SidebarProps) {
  const { empleado, dias_usados, tramos_usados, historial } = data
  const diasTotales = empleado.dias_totales

  const diasYaTomados =
    dias_usados + (row.estado === 'aprobada' ? row.dias : 0)
  const diasRestantes = diasTotales - diasYaTomados

  const tramosYaUsados = tramos_usados + (row.estado === 'aprobada' ? 1 : 0)

  const usedPct = diasTotales > 0 ? Math.min(100, (dias_usados / diasTotales) * 100) : 0
  const thisPct =
    row.estado === 'pendiente' && diasTotales > 0
      ? Math.min(100 - usedPct, (row.dias / diasTotales) * 100)
      : 0

  const excede =
    row.estado === 'pendiente' && dias_usados + row.dias > diasTotales

  const isLoading = actionLoading === row.id

  return (
    <div className="flex flex-col">
      {/* Sidebar header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <span className="text-sm font-bold text-ls-azul">{empleado.nombre}</span>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-sm"
          aria-label="Cerrar panel"
        >
          ✕
        </button>
      </div>

      <div className="p-5 flex flex-col gap-6">

        {/* Employee info */}
        <div className="flex flex-col gap-1 text-sm">
          <InfoRow label="Sector" value={empleado.sector_nombre} />
          <InfoRow label="Referente" value={empleado.referente_nombre} />
          <InfoRow label="Email" value={empleado.email} />
        </div>

        {/* Solicitud detail */}
        <div>
          <SectionTitle>Solicitud</SectionTitle>
          <div className="flex flex-col gap-1 text-sm">
            <InfoRow label="Período" value={`${ff(row.fecha_inicio)} – ${ff(row.fecha_fin)}`} />
            <InfoRow label="Días" value={String(row.dias)} />
            <InfoRow label="Tipo" value={row.tipo} />
            {row.notas && <InfoRow label="Notas" value={row.notas} />}
            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-xs text-ls-gris w-20 shrink-0">Estado</span>
              <LsBadge estado={row.estado} />
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div>
          <SectionTitle>Saldo de días</SectionTitle>
          <div className="grid grid-cols-3 gap-2">
            <MiniCard label="Totales" value={diasTotales} />
            <MiniCard label="Tomados" value={diasYaTomados} />
            <MiniCard
              label="Restantes"
              value={diasRestantes}
              accent={diasRestantes >= 0}
              danger={diasRestantes < 0}
            />
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-ls-gris mb-1.5">
            <span>Uso de días</span>
            <span>{diasYaTomados + (row.estado === 'pendiente' ? row.dias : 0)} / {diasTotales}</span>
          </div>
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ backgroundColor: '#F3F4F6', height: '10px' }}
          >
            <div style={{ display: 'flex', height: '100%' }}>
              <div style={{ width: `${usedPct}%`, backgroundColor: '#1B2C65', transition: 'width 0.3s' }} />
              {thisPct > 0 && (
                <div style={{ width: `${thisPct}%`, backgroundColor: '#F58220', transition: 'width 0.3s' }} />
              )}
            </div>
          </div>
          {thisPct > 0 && (
            <div className="flex items-center gap-4 mt-1.5 text-xs text-ls-gris">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#1B2C65' }} /> Tomados</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#F58220' }} /> Esta solicitud</span>
            </div>
          )}
        </div>

        {/* Alert */}
        {excede && (
          <div
            className="rounded-lg px-3.5 py-3 text-xs font-medium"
            style={{ backgroundColor: '#FFF7ED', color: '#92400E', border: '1px solid #FED7AA' }}
            role="alert"
          >
            ⚠️ Los días solicitados ({row.dias}) superan el saldo disponible ({diasTotales - dias_usados} días restantes).
          </div>
        )}

        {/* Fraccionamiento */}
        <div>
          <SectionTitle>Fraccionamiento</SectionTitle>
          <p className="text-sm text-gray-700">
            <span className="font-semibold text-ls-azul">{tramosYaUsados}</span>
            <span className="text-ls-gris"> de {TRAMOS_MAX} tramos usados</span>
          </p>
        </div>

        {/* Action buttons */}
        {row.estado === 'pendiente' && (
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => onAction(row.id, 'aprobar')}
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#16A34A' }}
            >
              ✓ Aprobar
            </button>
            <button
              onClick={() => onAction(row.id, 'rechazar')}
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}
            >
              ✗ Rechazar
            </button>
          </div>
        )}

        {/* Historial */}
        {historial.length > 0 && (
          <div>
            <SectionTitle>Historial del año</SectionTitle>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-ls-gris border-b border-gray-100">
                  <th className="text-left pb-1.5 font-semibold">Período</th>
                  <th className="text-left pb-1.5 font-semibold">Días</th>
                  <th className="text-left pb-1.5 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {historial.map((h) => (
                  <tr key={h.id} className="text-gray-700">
                    <td className="py-1.5 pr-2 whitespace-nowrap">
                      {ff(h.fecha_inicio)}–{ff(h.fecha_fin)}
                    </td>
                    <td className="py-1.5 pr-2">{h.dias}</td>
                    <td className="py-1.5">
                      <LsBadge estado={h.estado as 'pendiente' | 'aprobada' | 'rechazada'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-ls-gris w-20 shrink-0 text-xs pt-0.5">{label}</span>
      <span className="text-gray-800 text-xs leading-relaxed">{value}</span>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-ls-gris mb-2">{children}</p>
  )
}

function MiniCard({
  label,
  value,
  accent,
  danger,
}: {
  label: string
  value: number
  accent?: boolean
  danger?: boolean
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <p className="text-xs text-ls-gris mb-0.5">{label}</p>
      <p
        className="text-xl font-bold"
        style={{
          color: danger ? '#DC2626' : accent ? '#F58220' : '#1B2C65',
        }}
      >
        {value}
      </p>
    </div>
  )
}
