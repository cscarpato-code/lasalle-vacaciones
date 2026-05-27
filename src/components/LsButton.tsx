'use client'

import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-ls-azul text-white border border-transparent hover:bg-ls-azul-medio',
  secondary:
    'bg-transparent text-ls-azul border border-ls-azul hover:bg-ls-azul hover:text-white',
  danger:
    'bg-[#DC2626] text-white border border-transparent hover:bg-[#B91C1C]',
}

export default function LsButton({
  variant = 'primary',
  className = '',
  children,
  ...props
}: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
