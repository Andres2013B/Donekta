import { useState, useEffect } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'
export default function PldAdmin() {
  const router = useRouter()
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || session.user.email !== 'andresbraver@gmail.com') { router.push('/'); return }
      const { data } = await supabase.from('pld_alerts').select('*').order('created_at', { ascending: false })
      setAlerts(data || []); setLoading(false)
    }
    load()
  }, [])
  const statusLabel: Record<string, string> = { pending_identification: 'Pendiente', identified: 'Identificado', reported: 'Reportado', dismissed: 'Descartado' }
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>
  return (
    <>
      <Head><title>Alertas PLD — Donekta</title></Head>
      <div className="min-h-screen bg-gray-50 py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div><h1 className="text-2xl font-black text-gray-900">Alertas PLD</h1><p className="text-sm text-gray-500 mt-1">Donadores que cruzaron el umbral acumulado (LFPIORPI)</p></div>
            <a href="/api/pld/export" className="bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold px-4 py-2 rounded-xl">Exportar CSV</a>
          </div>
          {alerts.length === 0 ? <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center"><p className="text-gray-400">No hay alertas PLD.</p></div> : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100"><tr><th className="text-left px-6 py-3 font-semibold text-gray-600">Donador</th><th className="text-left px-6 py-3 font-semibold text-gray-600">Monto</th><th className="text-left px-6 py-3 font-semibold text-gray-600">Periodo</th><th className="text-left px-6 py-3 font-semibold text-gray-600">Estatus</th></tr></thead>
                <tbody>{alerts.map((a: any) => (<tr key={a.id} className="border-b border-gray-50 last:border-0"><td className="px-6 py-4 text-gray-900">{a.donor_email}</td><td className="px-6 py-4 font-bold text-emerald-600">${Number(a.accumulated_amount_mxn).toLocaleString('es-MX')} MXN</td><td className="px-6 py-4 text-gray-500">{new Date(a.period_start).toLocaleDateString('es-MX')} – {new Date(a.period_end).toLocaleDateString('es-MX')}</td><td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${a.status === 'pending_identification' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{statusLabel[a.status] || a.status}</span></td></tr>))}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
