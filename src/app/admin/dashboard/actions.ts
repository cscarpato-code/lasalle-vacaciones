'use server'

import { getAdminSession } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export type SidebarData = {
  empleado: {
    nombre: string
    email: string
    sector_nombre: string
    referente_nombre: string
    dias_totales: number
  }
  dias_usados: number
  tramos_usados: number
  historial: {
    id: string
    fecha_inicio: string
    fecha_fin: string
    dias: number
    tipo: string
    estado: string
    notas: string | null
  }[]
}

export async function getSidebarData(
  solicitudId: string,
  empleadoId: string,
  anio: number,
): Promise<SidebarData> {
  const session = await getAdminSession()
  if (!session) throw new Error('No autorizado')

  const supabase = await createClient()

  const [{ data: empleado }, { data: solicitudes }] = await Promise.all([
    supabase
      .from('empleados')
      .select('nombre, email, dias_totales, sectores(nombre, referente_nombre)')
      .eq('id', empleadoId)
      .single(),
    supabase
      .from('solicitudes')
      .select('id, fecha_inicio, fecha_fin, dias, tipo, estado, notas')
      .eq('empleado_id', empleadoId)
      .eq('anio', anio)
      .order('fecha_inicio', { ascending: true }),
  ])

  const sec = empleado
    ? ((Array.isArray(empleado.sectores)
        ? empleado.sectores[0]
        : empleado.sectores) as { nombre: string; referente_nombre: string } | null)
    : null

  const historial = (solicitudes ?? []).filter((s) => s.id !== solicitudId)
  const aprobadas = historial.filter((s) => s.estado === 'aprobada')
  const diasUsados = aprobadas.reduce((sum, s) => sum + (s.dias ?? 0), 0)
  const tramosUsados = aprobadas.length

  return {
    empleado: {
      nombre: empleado?.nombre ?? '',
      email: empleado?.email ?? '',
      sector_nombre: sec?.nombre ?? '',
      referente_nombre: sec?.referente_nombre ?? '',
      dias_totales: empleado?.dias_totales ?? 0,
    },
    dias_usados: diasUsados,
    tramos_usados: tramosUsados,
    historial,
  }
}
