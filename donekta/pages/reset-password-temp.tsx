import { useState } from 'react'
import Head from 'next/head'

export default function ResetPasswordTemp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  const handleSubmit = async () => {
    if (!email || !password) return
    setLoading(true); setResult('')
    try {
      const r = await fetch('/api/reset-password-temp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, secret: 'donekta-admin-2026' })
      })
      const d = await r.json()
      if (r.ok) setResult('✅ Contraseña actualizada correctamente')
      else setResult('❌ Error: ' + d.error)
    } catch (e: any) {
      setResult('❌ Error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head><title>Reset Password — Donekta Admin</title></Head>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-md">
          <h1 className="text-xl font-black text-gray-900 mb-6">Cambiar contraseña de usuario</h1>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo del usuario</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nueva contraseña</label>
              <input type="text" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Nueva contraseña"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400" />
            </div>
            {result && (
              <div className={`text-sm px-4 py-3 rounded-xl ${result.startsWith('✅') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {result}
              </div>
            )}
            <button onClick={handleSubmit} disabled={loading || !email || !password}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm">
              {loading ? 'Actualizando...' : 'Cambiar contraseña'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
