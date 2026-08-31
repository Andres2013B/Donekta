import { useState } from 'react'

type Props = {
  donorEmail: string
  onCompleted?: () => void
}

export default function DonorIdentificationForm({ donorEmail, onCompleted }: Props) {
  const [fullName, setFullName] = useState('')
  const [rfcOrCurp, setRfcOrCurp] = useState('')
  const [address, setAddress] = useState('')
  const [sourceOfFunds, setSourceOfFunds] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { setError('Adjunta una identificación oficial (INE, pasaporte).'); return }
    if (!acceptedTerms) { setError('Debes aceptar los términos antes de continuar.'); return }
    setSubmitting(true); setError(null)

    const formData = new FormData()
    formData.append('donorEmail', donorEmail)
    formData.append('fullName', fullName)
    formData.append('rfcOrCurp', rfcOrCurp)
    formData.append('address', address)
    formData.append('sourceOfFunds', sourceOfFunds)
    formData.append('idDocument', file)

    const res = await fetch('/api/pld/identify', { method: 'POST', body: formData })
    setSubmitting(false)

    if (!res.ok) { setError('No se pudo enviar tu información. Intenta de nuevo.'); return }
    setDone(true)
    onCompleted?.()
  }

  if (done) return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
      <p className="text-emerald-800 font-semibold text-lg">✓ Información enviada correctamente</p>
      <p className="text-emerald-600 text-sm mt-2">Tus datos han sido recibidos de forma confidencial.</p>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <h3 className="text-lg font-bold text-gray-900">Verificación de identidad requerida</h3>
        <p className="text-sm text-gray-500 mt-1">
          Por la Ley Antilavado (LFPIORPI), al superar cierto monto acumulado de donaciones
          necesitamos algunos datos adicionales. Tus datos se resguardan de forma confidencial.
        </p>
      </div>
      <input type="text" placeholder="Nombre completo" value={fullName} onChange={e => setFullName(e.target.value)} required
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400" />
      <input type="text" placeholder="RFC o CURP" value={rfcOrCurp} onChange={e => setRfcOrCurp(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400" />
      <input type="text" placeholder="Domicilio completo" value={address} onChange={e => setAddress(e.target.value)} required
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400" />
      <textarea placeholder="Origen de los recursos donados (ej. ingresos por sueldo, ahorro personal)"
        value={sourceOfFunds} onChange={e => setSourceOfFunds(e.target.value)} required rows={3}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400 resize-none" />
      <div>
        <label className="block text-sm text-gray-600 mb-1">Identificación oficial (INE, pasaporte)</label>
        <input type="file" accept="image/*,application/pdf" onChange={e => setFile(e.target.files?.[0] ?? null)} required />
      </div>
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
        <input type="checkbox" id="pld-terms" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)}
          className="mt-1 flex-shrink-0" />
        <label htmlFor="pld-terms" className="text-xs text-amber-800 leading-relaxed cursor-pointer">
          Declaro bajo protesta de decir verdad que la información y documentos proporcionados son auténticos y verídicos. 
          Entiendo que proporcionar información falsa constituye un delito federal y que asumo toda la responsabilidad legal derivada de ello, 
          conforme a la Ley Federal para la Prevención e Identificación de Operaciones con Recursos de Procedencia Ilícita (LFPIORPI).
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting || !acceptedTerms}
        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm">
        {submitting ? 'Enviando...' : 'Enviar información'}
      </button>
    </form>
  )
}
