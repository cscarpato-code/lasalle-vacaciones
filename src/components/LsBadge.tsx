type Estado = 'pendiente' | 'aprobada' | 'rechazada'

const estilos: Record<Estado, { bg: string; color: string; label: string }> = {
  pendiente: { bg: '#FFF3CD', color: '#856404', label: 'Pendiente' },
  aprobada:  { bg: '#D1FAE5', color: '#065F46', label: 'Aprobada'  },
  rechazada: { bg: '#FEE2E2', color: '#991B1B', label: 'Rechazada' },
}

type Props = {
  estado: Estado
}

export default function LsBadge({ estado }: Props) {
  const { bg, color, label } = estilos[estado]
  return (
    <span
      style={{ backgroundColor: bg, color }}
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
    >
      {label}
    </span>
  )
}
