type Props = {
  title?: string
  children: React.ReactNode
  className?: string
}

export default function LsCard({ title, children, className = '' }: Props) {
  return (
    <div
      className={`bg-white rounded-[12px] border border-gray-200 p-6 shadow-sm ${className}`}
    >
      {title && (
        <h2 className="text-ls-azul font-bold text-lg mb-4 leading-snug">
          {title}
        </h2>
      )}
      {children}
    </div>
  )
}
