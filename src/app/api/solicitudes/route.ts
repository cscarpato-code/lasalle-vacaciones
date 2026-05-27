import { NextResponse } from 'next/server'
import { getEmpleadoSession } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { emailReferente } from '@/lib/emails'

export async function POST(request: Request) {
  const session = await getEmpleadoSession()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  let body: { fecha_inicio?: unknown; fecha_fin?: unknown; dias?: unknown; tipo?: unknown; notas?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { fecha_inicio, fecha_fin, dias, tipo, notas } = body

  if (
    typeof fecha_inicio !== 'string' || !fecha_inicio ||
    typeof fecha_fin !== 'string' || !fecha_fin ||
    typeof dias !== 'number' || dias <= 0 ||
    typeof tipo !== 'string' || !tipo
  ) {
    return NextResponse.json({ error: 'Datos requeridos: fecha_inicio, fecha_fin, dias, tipo' }, { status: 400 })
  }

  if (fecha_inicio >= fecha_fin) {
    return NextResponse.json({ error: 'fecha_inicio debe ser anterior a fecha_fin' }, { status: 400 })
  }

  const supabase = await createClient()
  const anio = new Date(fecha_inicio).getFullYear()

  const { data: solicitud, error: insertError } = await supabase
    .from('solicitudes')
    .insert({
      empleado_id: session.id,
      fecha_inicio,
      fecha_fin,
      dias,
      tipo,
      estado: 'pendiente',
      anio,
      notas: typeof notas === 'string' && notas.trim() ? notas.trim() : null,
    })
    .select('id')
    .single()

  if (insertError || !solicitud) {
    console.error('Error insertando solicitud:', insertError)
    return NextResponse.json({ error: 'No se pudo guardar la solicitud' }, { status: 500 })
  }

  // Fetch sector info for the referente email (best-effort, don't fail on email error)
  const { data: sectorData } = await supabase
    .from('sectores')
    .select('nombre, referente_email, referente_nombre')
    .eq('id', session.sector_id)
    .single()

  if (sectorData) {
    emailReferente({
      empleado_nombre: session.nombre,
      sector_nombre: sectorData.nombre,
      referente_email: sectorData.referente_email,
      referente_nombre: sectorData.referente_nombre,
      fecha_inicio,
      fecha_fin,
      dias,
      solicitud_id: solicitud.id,
    }).catch((err) => console.error('Error enviando email al referente:', err))
  }

  return NextResponse.json({ ok: true, solicitud_id: solicitud.id }, { status: 201 })
}
