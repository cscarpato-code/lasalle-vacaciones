'use client'

import { useState } from 'react'

type Props = {
  diasRestantes: number
  tramosRestantes: number
}

export default function ModalFormulario({ diasRestantes, tramosRestantes }: Props) {
  const [open, setOpen] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const formUrl = process.env.NEXT_PUBLIC_GOOGLE_FORM_URL

  function handleClose() {
    setOpen(false)
    setShowSuccess(true)
  }

  if (showSuccess) {
    return (
      <div
        className="rounded-xl px-5 py-4 text-sm font-medium flex items-start gap-3"
        style={{ backgroundColor: '#DCFCE7', color: '#166534' }}
        role="status"
      >
        <span className="shrink-0 text-base leading-snug">✓</span>
        <span>
          ¡Solicitud enviada! Tu referente te responderá dentro de las{' '}
          <strong>72 horas hábiles</strong>.
        </span>
      </div>
    )
  }

  const disabled = diasRestantes <= 0 || tramosRestantes <= 0

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-ls-azul-medio"
        style={{ backgroundColor: '#1B2C65' }}
        title={
          disabled
            ? diasRestantes <= 0
              ? 'No tenés días disponibles'
              : 'Alcanzaste el límite de tramos'
            : undefined
        }
      >
        <span aria-hidden="true">+</span>
        Solicitar vacaciones
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <span className="text-sm font-semibold text-ls-azul">Solicitar vacaciones</span>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            {/* Form iframe */}
            {formUrl ? (
              <iframe
                src={formUrl}
                className="w-full border-none"
                style={{ height: '520px' }}
                title="Formulario de solicitud de vacaciones"
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-sm text-ls-gris">
                Formulario no configurado (NEXT_PUBLIC_GOOGLE_FORM_URL)
              </div>
            )}

            {/* Modal footer */}
            <div className="flex justify-end px-6 py-4 border-t border-gray-100">
              <button
                onClick={handleClose}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors hover:bg-ls-azul-medio"
                style={{ backgroundColor: '#1B2C65' }}
              >
                Listo, envié el formulario
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
