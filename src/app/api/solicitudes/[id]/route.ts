import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { emailAprobada, emailRechazada } from '@/lib/emails'

type Props = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, { params }: Props) {
  const adminSession = await getAdminSession()
  if (!adminSession) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = await params

  let body: { accion?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { accion } = body
  if (accion !== 'aprobar' && accion !== 'rechazar') {
    return NextResponse.json({ error: "accion debe ser 'aprobar' o 'rechazar'" }, { status: 400 })
  }

  const nuevoEstado = accion === 'aprobar' ? 'aprobada' : 'rechazada'

  const supabase = await createClient()

  // Fetch solicitud + empleado data before updating
  const { data: solicitud, error: fetchError } = await supabase
    .from('solicitudes')
    .select('id, fecha_inicio, fecha_fin, dias, estado, empleado_id, empleados(nombre, email)')
    .eq('id', id)
    .single()

  if (fetchError || !solicitud) {
    return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
  }

  if (solicitud.estado !== 'pendiente') {
    return NextResponse.json({ error: 'Solo se pueden responder solicitudes pendientes' }, { status: 409 })
  }

  const { error: updateError } = await supabase
    .from('solicitudes')
    .update({ estado: nuevoEstado, respondida_at: new Date().toISOString() })
    .eq('id', id)

  if (updateError) {
    console.error('Error actualizando solicitud:', updateError)
    return NextResponse.json({ error: 'No se pudo actualizar la solicitud' }, { status: 500 })
  }

  // Send notification email to employee (best-effort)
  const empleado = (
    Array.isArray(solicitud.empleados) ? solicitud.empleados[0] : solicitud.empleados
  ) as { nombre: string; email: string } | null

  if (empleado?.email) {
    const emailFn =
      accion === 'aprobar'
        ? () =>
            emailAprobada({
              empleado_email: empleado.email,
              empleado_nombre: empleado.nombre,
              fecha_inicio: solicitud.fecha_inicio,
              fecha_fin: solicitud.fecha_fin,
              dias: solicitud.dias,
            })
        : () =>
            emailRechazada({
              empleado_email: empleado.email,
              empleado_nombre: empleado.nombre,
            })

    emailFn().catch((err) => console.error('Error enviando email al empleado:', err))
  }

  return NextResponse.json({ ok: true })
}
