export type Sector = {
  id: string
  nombre: string
  slug: string
  referente_email: string
  referente_nombre: string
  created_at: string
}

export type Empleado = {
  id: string
  nombre: string
  email: string
  username: string
  password_hash: string
  sector_id: string
  dias_totales: number
  anio: number
  created_at: string
}

export type Solicitud = {
  id: string
  empleado_id: string
  fecha_inicio: string
  fecha_fin: string
  dias: number
  tipo: string
  estado: string
  anio: number
  notas: string | null
  respondida_at: string | null
  created_at: string
}

export type SolicitudConEmpleado = Solicitud & {
  empleado: Empleado & {
    sector: Sector
  }
}
