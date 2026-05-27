import { NextResponse } from 'next/server'
import { loginEmpleado } from '@/lib/auth'

export async function POST(request: Request) {
  let body: { username?: unknown; password?: unknown }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { username, password } = body

  if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
    return NextResponse.json({ error: 'Credenciales requeridas' }, { status: 400 })
  }

  const session = await loginEmpleado(username, password)

  if (!session) {
    return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 })
  }

  return NextResponse.json({ ok: true, session })
}
