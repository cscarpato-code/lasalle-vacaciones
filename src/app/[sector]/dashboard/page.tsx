import { redirect } from 'next/navigation'
import { getEmpleadoSession } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import LsSidebar from '@/components/LsSidebar'
import LsCard from '@/components/LsCard'
import LsBadge from '@/components/LsBadge'
import CalendarioSector from '@/components/CalendarioSector'
import ModalFormulario from '@/components/ModalFormulario'

type Props = {
  params: Promise<{ sector: string }>
}

const TRAMOS_MAX = 3

export default async function DashboardPage({ params }: Props) {
  const { sector: slug } = await params

  const session = await getEmpleadoSession()
  if (!session || session.sector_slug !== slug) {
    redirect(`/${slug}`)
  }

  const supabase = await createClient()
  const anioActual = new Date().getFullYear()

  // Parallel: sector name + employee's approved solicitudes + all sector employees
  const [{ data: sectorData }, { data: misSolicitudes }, { data: companerosData }] =
    await Promise.all([
      supabase.from('sectores').select('nombre').eq('slug', slug).single(),
      supabase
        .from('solicitudes')
        .select('id, fecha_inicio, fecha_fin, dias, tipo, estado, notas, created_at')
        .eq('empleado_id', session.id)
        .eq('anio', anioActual)
        .order('created_at', { ascending: false }),
      supabase
        .from('empleados')
        .select('id, nombre')
        .eq('sector_id', session.sector_id),
    ])

  // Fetch approved solicitudes for the whole sector
  const empleadoIds = (companerosData ?? []).map((e) => e.id)
  const { data: sectorSolicitudes } = empleadoIds.length
    ? await supabase
        .from('solicitudes')
        .select('empleado_id, fecha_inicio, fecha_fin')
        .in('empleado_id', empleadoIds)
        .eq('estado', 'aprobada')
        .eq('anio', anioActual)
    : { data: [] }

  // Build calendar data
  const nombrePorId = Object.fromEntries(
    (companerosData ?? []).map((e) => [e.id, e.nombre])
  )
  const solicitudesCalendario = (sectorSolicitudes ?? []).map((s) => ({
    empleado_id: s.empleado_id,
    empleado_nombre: nombrePorId[s.empleado_id] ?? 'Compañero',
    fecha_inicio: s.fecha_inicio,
    fecha_fin: s.fecha_fin,
  }))

  // Stats
  const solicitudesAprobadas = (misSolicitudes ?? []).filter(
    (s) => s.estado === 'aprobada'
  )
  const diasUsados = solicitudesAprobadas.reduce((sum, s) => sum + (s.dias ?? 0), 0)
  const diasRestantes = session.dias_totales - diasUsados
  const tramosUsados = solicitudesAprobadas.length
  const tramosRestantes = Math.max(0, TRAMOS_MAX - tramosUsados)

  const sectorNombre = sectorData?.nombre ?? slug

  return (
    <div className="h-screen overflow-hidden flex" style={{ backgroundColor: '#F5F6FA' }}>
      <LsSidebar
        nombre={session.nombre}
        sector={sectorNombre}
        logoutRedirect={`/${slug}`}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-8">

          {/* ── 1. Stats cards ───────────────────────────────── */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-ls-gris mb-4">
              Resumen {anioActual}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Días totales" value={session.dias_totales} />
              <StatCard
                label="Días usados"
                value={diasUsados}
                muted={diasUsados === 0}
              />
              <StatCard
                label="Días restantes"
                value={diasRestantes}
                highlight={diasRestantes > 0}
              />
              <StatCard
                label="Tramos restantes"
                value={`${tramosRestantes} / ${TRAMOS_MAX}`}
                muted={tramosRestantes === 0}
              />
            </div>
          </section>

          {/* ── 2. Períodos info + solicitar ─────────────────── */}
          <section className="flex flex-col sm:flex-row sm:items-start gap-4">
            <LsCard className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-ls-gris mb-3">
                Períodos disponibles
              </p>
              <ul className="text-sm text-gray-700 flex flex-col gap-1.5 list-disc list-inside marker:text-ls-naranja">
                <li>Podés tomar hasta <strong>{TRAMOS_MAX} tramos</strong> por año</li>
                <li>Cada tramo debe tener al menos <strong>7 días corridos</strong></li>
                <li>Coordiná con tu sector para evitar superposiciones</li>
              </ul>
            </LsCard>

            <div className="sm:pt-1">
              <ModalFormulario
                diasRestantes={diasRestantes}
                tramosRestantes={tramosRestantes}
              />
            </div>
          </section>

          {/* ── 3. Calendario del sector ─────────────────────── */}
          <section>
            <LsCard>
              <p className="text-xs font-semibold uppercase tracking-widest text-ls-gris mb-5">
                Calendario del sector
              </p>
              <CalendarioSector
                solicitudes={solicitudesCalendario}
                empleadoId={session.id}
              />
            </LsCard>
          </section>

          {/* ── 4. Mis solicitudes ───────────────────────────── */}
          <section>
            <LsCard>
              <p className="text-xs font-semibold uppercase tracking-widest text-ls-gris mb-5">
                Mis solicitudes
              </p>

              {(misSolicitudes ?? []).length === 0 ? (
                <p className="text-sm text-ls-gris">
                  Todavía no tenés solicitudes este año.
                </p>
              ) : (
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs font-semibold text-ls-gris border-b border-gray-100">
                        <th className="text-left pb-2 pr-4">Período</th>
                        <th className="text-left pb-2 pr-4">Días</th>
                        <th className="text-left pb-2 pr-4">Tipo</th>
                        <th className="text-left pb-2 pr-4">Estado</th>
                        <th className="text-left pb-2">Notas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(misSolicitudes ?? []).map((s) => (
                        <tr key={s.id} className="text-gray-700">
                          <td className="py-2.5 pr-4 whitespace-nowrap">
                            {formatFecha(s.fecha_inicio)} – {formatFecha(s.fecha_fin)}
                          </td>
                          <td className="py-2.5 pr-4">{s.dias}</td>
                          <td className="py-2.5 pr-4 capitalize">{s.tipo}</td>
                          <td className="py-2.5 pr-4">
                            <LsBadge estado={s.estado as 'pendiente' | 'aprobada' | 'rechazada'} />
                          </td>
                          <td className="py-2.5 text-ls-gris text-xs max-w-[200px] truncate">
                            {s.notas ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </LsCard>
          </section>

        </div>
      </main>
    </div>
  )
}

function StatCard({
  label,
  value,
  highlight,
  muted,
}: {
  label: string
  value: number | string
  highlight?: boolean
  muted?: boolean
}) {
  return (
    <LsCard className="flex flex-col gap-1">
      <p className="text-xs text-ls-gris">{label}</p>
      <p
        className="text-2xl font-bold"
        style={{ color: highlight ? '#F58220' : muted ? '#9CA3AF' : '#1B2C65' }}
      >
        {value}
      </p>
    </LsCard>
  )
}

function formatFecha(iso: string) {
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}
