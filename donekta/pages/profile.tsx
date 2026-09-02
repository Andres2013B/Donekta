import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { Heart, LogOut, Edit } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Profile() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [donations, setDonations] = useState<any[]>([])
  const [community, setCommunity] = useState<any>(null)
  const [totalDonated, setTotalDonated] = useState(0)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/'); return }
      setUser(session.user)
      const { data: donationData } = await supabase.from('donations').select('*, communities(name)')
        .eq('donor_email', session.user.email).order('created_at', { ascending: false })
      setDonations(donationData || [])
      setTotalDonated((donationData || []).reduce((sum: number, d: any) => sum + d.amount, 0))
      const { data: comm } = await supabase.from('communities').select('*').eq('contact_email', session.user.email).single()
      if (comm) setCommunity(comm)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const initials = (user?.user_metadata?.full_name || user?.email || 'U')
    .split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <>
      <Head><title>Mi perfil — Donekta</title></Head>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-100 px-6 py-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <button onClick={() => window.location.href = '/'} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <img src="/logo-donekta-oscuro.svg" alt="Donekta" style={{ height: 32 }} />
            </button>
            <div className="flex items-center gap-4">
              <a href="/donor" className="text-sm text-gray-500 hover:text-gray-700">Comunidades</a>
              <button onClick={() => { supabase.auth.signOut(); router.push('/') }}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600">
                <LogOut className="w-4 h-4" /> Cerrar sesión
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-6 py-10">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center text-white text-2xl font-black flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-black text-gray-900">{user?.user_metadata?.full_name || user?.email?.split('@')[0]}</h1>
                <p className="text-gray-500 text-sm mt-1">{user?.email}</p>
                <p className="text-xs text-gray-400 mt-1">Miembro desde {new Date(user?.created_at).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</p>
              </div>
              {community?.status === 'approved' && (
                <a href="/community-edit" className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-xl">
                  <Edit className="w-4 h-4" /> Editar mi comunidad
                </a>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <p className="text-sm text-gray-500 mb-1">Total donado</p>
              <p className="text-3xl font-black text-emerald-600">${totalDonated.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">MXN</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <p className="text-sm text-gray-500 mb-1">Donaciones realizadas</p>
              <p className="text-3xl font-black text-gray-900">{donations.length}</p>
              <p className="text-xs text-gray-400 mt-1">en total</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Historial de donaciones</h2>
            {donations.length === 0 ? (
              <div className="text-center py-10">
                <Heart className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Aún no has hecho donaciones</p>
                <a href="/donor" className="text-emerald-600 text-sm font-medium hover:text-emerald-700 mt-2 inline-block">Ver comunidades →</a>
              </div>
            ) : (
              <div className="space-y-3">
                {donations.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{d.communities?.name || 'Comunidad'}</p>
                      <p className="text-xs text-gray-400">{new Date(d.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <span className="font-bold text-emerald-600">${d.amount.toLocaleString()} MXN</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
