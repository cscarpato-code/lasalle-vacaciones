import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/server'

export type EmpleadoSession = {
  id: string
  nombre: string
  username: string
  sector_id: string
  sector_slug: string
  dias_totales: number
}

export type AdminSession = {
  autenticado: true
}

const SESSION_MAX_AGE = 60 * 60 * 8

function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  }
}

export async function loginEmpleado(
  username: string,
  password: string
): Promise<EmpleadoSession | null> {
  const supabase = await createClient()

  const { data: empleado } = await supabase
    .from('empleados')
    .select('id, nombre, username, password_hash, sector_id, dias_totales, sectores(slug)')
    .eq('username', username)
    .single()

  if (!empleado) return null

  const valid = await bcrypt.compare(password, empleado.password_hash)
  if (!valid) return null

  const sector = (
    Array.isArray(empleado.sectores) ? empleado.sectores[0] : empleado.sectores
  ) as { slug: string } | null
  if (!sector) return null

  const session: EmpleadoSession = {
    id: empleado.id,
    nombre: empleado.nombre,
    username: empleado.username,
    sector_id: empleado.sector_id,
    sector_slug: sector.slug,
    dias_totales: empleado.dias_totales,
  }

  const cookieStore = await cookies()
  cookieStore.set('empleado_session', JSON.stringify(session), sessionCookieOptions())

  return session
}

export async function loginAdmin(password: string): Promise<boolean> {
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return false
  }

  const session: AdminSession = { autenticado: true }
  const cookieStore = await cookies()
  cookieStore.set('admin_session', JSON.stringify(session), sessionCookieOptions())

  return true
}

export async function getEmpleadoSession(): Promise<EmpleadoSession | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get('empleado_session')?.value
  if (!raw) return null

  try {
    return JSON.parse(raw) as EmpleadoSession
  } catch {
    return null
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get('admin_session')?.value
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    if (parsed?.autenticado !== true) return null
    return parsed as AdminSession
  } catch {
    return null
  }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('empleado_session')
  cookieStore.delete('admin_session')
}
