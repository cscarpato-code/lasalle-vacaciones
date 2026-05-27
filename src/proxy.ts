import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function parseCookie(value: string | undefined): Record<string, unknown> | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    return typeof parsed === 'object' && parsed !== null ? parsed : null
  } catch {
    return null
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin/dashboard')) {
    const session = parseCookie(request.cookies.get('admin_session')?.value)
    if (!session || session.autenticado !== true) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return NextResponse.next()
  }

  const match = pathname.match(/^\/([^/]+)\/dashboard/)
  if (match) {
    const sectorSlug = match[1]
    const session = parseCookie(request.cookies.get('empleado_session')?.value)
    if (!session || session.sector_slug !== sectorSlug) {
      return NextResponse.redirect(new URL(`/${sectorSlug}`, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/dashboard/:path*', '/:sector/dashboard/:path*'],
}
