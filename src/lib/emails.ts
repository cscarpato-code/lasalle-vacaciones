import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM ?? 'vacaciones@lasalle.edu.ar'

// ── Shared HTML shell ────────────────────────────────────────────────────────

function shell(body: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vacaciones La Salle</title>
</head>
<body style="margin:0;padding:0;background:#F5F6FA;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F6FA;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Header -->
        <tr>
          <td style="background:#1B2C65;padding:24px 32px;border-radius:12px 12px 0 0;">
            <span style="color:#F58220;font-size:22px;line-height:1;">&#9733;</span>
            <span style="color:#ffffff;font-size:18px;font-weight:bold;margin-left:8px;vertical-align:middle;">La Salle Argentina</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:32px;border-radius:0 0 12px 12px;">
            ${body}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 0 0;text-align:center;">
            <p style="margin:0;font-size:11px;color:#9CA3AF;">
              Sistema de Gestión de Vacaciones &middot; La Salle Argentina
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:6px 0;font-size:13px;color:#636466;width:130px;vertical-align:top;">${label}</td>
    <td style="padding:6px 0;font-size:13px;color:#1B2C65;font-weight:600;">${value}</td>
  </tr>`
}

function formatFecha(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

// ── Email al referente ───────────────────────────────────────────────────────

type EmailReferenteParams = {
  empleado_nombre: string
  sector_nombre: string
  referente_email: string
  referente_nombre: string
  fecha_inicio: string
  fecha_fin: string
  dias: number
  solicitud_id: string
}

export async function emailReferente(p: EmailReferenteParams) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const html = shell(`
    <p style="margin:0 0 8px;font-size:15px;color:#1B2C65;font-weight:600;">
      Hola ${p.referente_nombre},
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:#636466;line-height:1.6;">
      <strong style="color:#1B2C65;">${p.empleado_nombre}</strong>
      solicitó vacaciones en el sector <strong style="color:#1B2C65;">${p.sector_nombre}</strong>.
      Revisá los detalles y respondé desde el panel de administración.
    </p>

    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:28px;">
      ${row('Empleado', p.empleado_nombre)}
      ${row('Sector', p.sector_nombre)}
      ${row('Desde', formatFecha(p.fecha_inicio))}
      ${row('Hasta', formatFecha(p.fecha_fin))}
      ${row('Días', `${p.dias} días`)}
    </table>

    <a href="${appUrl}/admin/dashboard"
       style="display:inline-block;background:#1B2C65;color:#ffffff;font-size:14px;font-weight:600;
              padding:12px 24px;border-radius:8px;text-decoration:none;">
      Revisar solicitud →
    </a>
  `)

  return resend.emails.send({
    from: FROM,
    to: p.referente_email,
    subject: `Nueva solicitud de vacaciones — ${p.empleado_nombre}`,
    html,
  })
}

// ── Email de aprobación al empleado ─────────────────────────────────────────

type EmailAprobadaParams = {
  empleado_email: string
  empleado_nombre: string
  fecha_inicio: string
  fecha_fin: string
  dias: number
}

export async function emailAprobada(p: EmailAprobadaParams) {
  const html = shell(`
    <p style="margin:0 0 8px;font-size:15px;color:#1B2C65;font-weight:600;">
      Hola ${p.empleado_nombre},
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:#636466;line-height:1.6;">
      ¡Buenas noticias! Tu solicitud de vacaciones fue
      <strong style="color:#16A34A;">aprobada</strong>.
    </p>

    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:28px;">
      ${row('Desde', formatFecha(p.fecha_inicio))}
      ${row('Hasta', formatFecha(p.fecha_fin))}
      ${row('Días', `${p.dias} días`)}
    </table>

    <p style="margin:0;font-size:13px;color:#636466;line-height:1.6;">
      ¡Que disfrutes tu descanso!
    </p>
  `)

  return resend.emails.send({
    from: FROM,
    to: p.empleado_email,
    subject: 'Tus vacaciones fueron aprobadas ✓',
    html,
  })
}

// ── Email de rechazo al empleado ─────────────────────────────────────────────

type EmailRechazadaParams = {
  empleado_email: string
  empleado_nombre: string
}

export async function emailRechazada(p: EmailRechazadaParams) {
  const html = shell(`
    <p style="margin:0 0 8px;font-size:15px;color:#1B2C65;font-weight:600;">
      Hola ${p.empleado_nombre},
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:#636466;line-height:1.6;">
      Tu solicitud de vacaciones no pudo ser aprobada en esta instancia.
    </p>
    <p style="margin:0;font-size:14px;color:#636466;line-height:1.6;">
      Por favor, <strong style="color:#1B2C65;">comunicate con tu referente</strong>
      para coordinar las fechas y volver a presentar la solicitud.
    </p>
  `)

  return resend.emails.send({
    from: FROM,
    to: p.empleado_email,
    subject: 'Actualización sobre tu solicitud de vacaciones',
    html,
  })
}
