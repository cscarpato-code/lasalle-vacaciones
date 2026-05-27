type SolicitudCalendario = {
  empleado_id: string
  empleado_nombre: string
  fecha_inicio: string
  fecha_fin: string
}

type DiaInfo = { nombres: string[]; esPropio: boolean }

type Props = {
  solicitudes: SolicitudCalendario[]
  empleadoId: string
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toKey(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

function buildDayMap(solicitudes: SolicitudCalendario[], empleadoId: string) {
  const map = new Map<string, DiaInfo>()

  for (const s of solicitudes) {
    const esPropio = s.empleado_id === empleadoId
    // Use noon to stay immune to DST boundary issues
    const inicio = new Date(`${s.fecha_inicio}T12:00:00`)
    const fin = new Date(`${s.fecha_fin}T12:00:00`)

    for (const d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
      const key = toKey(d.getFullYear(), d.getMonth(), d.getDate())
      const existing = map.get(key)
      if (existing) {
        if (!existing.nombres.includes(s.empleado_nombre)) {
          existing.nombres.push(s.empleado_nombre)
        }
        if (esPropio) existing.esPropio = true
      } else {
        map.set(key, { nombres: [s.empleado_nombre], esPropio })
      }
    }
  }
  return map
}

function getMonthCells(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = (firstDay.getDay() + 6) % 7 // Mon=0 … Sun=6

  const cells: (number | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export default function CalendarioSector({ solicitudes, empleadoId }: Props) {
  const dayMap = buildDayMap(solicitudes, empleadoId)
  const today = new Date()
  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate())

  return (
    <div className="flex flex-col gap-8">
      {[0, 1, 2].map((offset) => {
        const ref = new Date(today.getFullYear(), today.getMonth() + offset, 1)
        const year = ref.getFullYear()
        const month = ref.getMonth()
        const cells = getMonthCells(year, month)

        return (
          <div key={`${year}-${month}`}>
            <p className="text-sm font-bold text-ls-azul mb-3">
              {MESES[month]} {year}
            </p>

            <div className="grid grid-cols-7 gap-y-1">
              {/* Day headers */}
              {DIAS_SEMANA.map((dia) => (
                <div
                  key={dia}
                  className="text-center text-xs font-semibold text-ls-gris pb-1"
                >
                  {dia}
                </div>
              ))}

              {/* Day cells */}
              {cells.map((day, i) => {
                if (day === null) return <div key={`empty-${offset}-${i}`} />

                const key = toKey(year, month, day)
                const info = dayMap.get(key)
                const isToday = key === todayKey

                return (
                  <div
                    key={key}
                    className="relative group flex items-center justify-center py-0.5"
                  >
                    <div
                      className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium select-none ${
                        info
                          ? 'text-white cursor-default'
                          : isToday
                          ? 'text-ls-azul ring-2 ring-ls-azul font-bold'
                          : 'text-gray-600'
                      }`}
                      style={
                        info?.esPropio
                          ? { backgroundColor: '#F58220' }
                          : info
                          ? { backgroundColor: '#1B2C65' }
                          : {}
                      }
                    >
                      {day}
                    </div>

                    {/* CSS-only tooltip */}
                    {info && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-20 pointer-events-none">
                        <div className="bg-gray-900 text-white text-[11px] leading-snug rounded-lg px-2.5 py-1.5 whitespace-nowrap max-w-[180px] shadow-lg">
                          {info.nombres.join(', ')}
                        </div>
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-gray-900" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Legend */}
      <div className="flex items-center gap-6 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: '#F58220' }}
          />
          <span className="text-xs text-ls-gris">Tus vacaciones</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: '#1B2C65' }}
          />
          <span className="text-xs text-ls-gris">Compañeros del sector</span>
        </div>
      </div>
    </div>
  )
}
