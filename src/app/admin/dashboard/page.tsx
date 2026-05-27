import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import AdminDashboard, { type SolicitudRow } from './AdminDashboard'

type Props = {
  searchParams: Promise<{ anio?: string }>
}

export default async function AdminDashboardPage({ searchParams }: Props) {
  const adminSession = await getAdminSession()
  if (!adminSession) redirect('/admin')

  const { anio: anioParam } = await searchParams
  const anio = Number(anioParam) || new Date().getFullYear()

  const supabase = await createClient()

  const [{ data: sectoresData }, { data: raw }] = await Promise.all([
    supabase.from('sectores').select('id, nombre').order('nombre'),
    supabase
      .from('solicitudes')
      .select(`
        id, empleado_id, fecha_inicio, fecha_fin, dias, tipo, estado, notas, created_at,
        empleados(nombre, email, dias_totales, sector_id, sectores(id, nombre, referente_nombre))
      `)
      .eq('anio', anio)
      .order('created_at', { ascending: false }),
  ])

  const solicitudes: SolicitudRow[] = (raw ?? []).map((s) => {
    const emp = (
      Array.isArray(s.empleados) ? s.empleados[0] : s.empleados
    ) as {
      nombre: string
      email: string
      dias_totales: number
      sector_id: string
      sectores:
        | { id: string; nombre: string; referente_nombre: string }
        | { id: string; nombre: string; referente_nombre: string }[]
        | null
    } | null

    const sec = emp
      ? ((Array.isArray(emp.sectores)
          ? emp.sectores[0]
          : emp.sectores) as { id: string; nombre: string; referente_nombre: string } | null)
      : null

    return {
      id: s.id,
      empleado_id: s.empleado_id,
      empleado_nombre: emp?.nombre ?? '—',
      empleado_email: emp?.email ?? '',
      empleado_dias_totales: emp?.dias_totales ?? 0,
      sector_id: emp?.sector_id ?? '',
      sector_nombre: sec?.nombre ?? '—',
      sector_referente: sec?.referente_nombre ?? '',
      fecha_inicio: s.fecha_inicio,
      fecha_fin: s.fecha_fin,
      dias: s.dias,
      tipo: s.tipo,
      estado: s.estado as 'pendiente' | 'aprobada' | 'rechazada',
      notas: s.notas,
      created_at: s.created_at,
    }
  })

  return (
    <AdminDashboard
      key={anio}
      solicitudes={solicitudes}
      sectores={sectoresData ?? []}
      anio={anio}
    />
  )
}
