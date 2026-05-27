import { NextResponse } from 'next/server'
import { loginAdmin } from '@/lib/auth'

export async function POST(request: Request) {
  let body: { password?: unknown }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { password } = body

  if (typeof password !== 'string' || !password) {
    return NextResponse.json({ error: 'Contraseña requerida' }, { status: 400 })
  }

  const ok = await loginAdmin(password)

  if (!ok) {
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
  }

  return NextResponse.json({ ok: true })
}
