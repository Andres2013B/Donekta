import { useState, useEffect } from 'react'
import Head from 'next/head'
import { Heart, Search, MapPin, Users, ArrowLeft } from 'lucide-react'
import { supabase, Community } from '../lib/supabase'
import DonationCheckout from '../components/DonationCheckout'

export default function Donor() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Community | null>(null)
  const [amount, setAmount] = useState(118)
  const [customAmount, setCustomAmount] = useState('')
  const [showCheckout, setShowCheckout] = useState(false)
  const [donated, setDonated] = useState(false)
  const [donorName, setDonorName] = useState('')
  const [donorEmail, setDonorEmail] = useState('')
  const [dedicateTo, setDedicateTo] = useState('')
  const [dedicateEmail, setDedicateEmail] = useState('')
  const [frequency, setFrequency] = useState<'única' | 'mensual' | 'trimestral' | 'semestral' | 'anual'>('única')
  const [lastDonationId, setLastDonationId] = useState<string | null>(null)
  const [anonymousDonation, setAnonymousDonation] = useState(false)
  const [dedicateMode, setDedicateMode] = useState<'self' | 'anonymous' | 'dedicate'>('self')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { window.location.href = '/'; return }
      setDonorEmail(data.session.user.email || '')
      setDonorName(data.session.user.user_metadata?.full_name || '')
    })
    fetchCommunities()
  }, [])

  const fetchCommunities = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('communities')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
    setCommunities(data || [])
    setLoading(false)
  }

  const filtered = communities.filter(c =>
    !search || (c.name + c.category + c.city).toLowerCase().includes(search.toLowerCase())
  )

  const catColor: Record<string, { bg: string; text: string; banner: string }> = {
    'Alimentación':    { bg: '#d1fae5', text: '#065f46', banner: '#d1fae5' },
    'Educación':       { bg: '#dbeafe', text: '#1e40af', banner: '#dbeafe' },
    'Salud':           { bg: '#ede9fe', text: '#5b21b6', banner: '#ede9fe' },
    'Vivienda':        { bg: '#fef3c7', text: '#92400e', banner: '#fef3c7' },
    'Medio ambiente':  { bg: '#dcfce7', text: '#166534', banner: '#dcfce7' },
    'Arte y cultura':  { bg: '#ffedd5', text: '#9a3412', banner: '#ffedd5' },
    'Derechos humanos':{ bg: '#fce7f3', text: '#9d174d', banner: '#fce7f3' },
    'Otro':            { bg: '#f3f4f6', text: '#374151', banner: '#f3f4f6' },
  }
  const getColor = (cat: string) => catColor[cat] || catColor['Otro']

  const handleDonationSuccess = async () => {
    if (!selected) return
    await supabase.from('communities').update({
      raised_amount: (selected.raised_amount || 0) + amount
    }).eq('id', selected.id)
    const { data: donData } = await supabase.from('donations').insert([{
      community_id: selected.id,
      donor_name: dedicateTo ? `${donorName} (en nombre de ${dedicateTo})` : donorName,
      donor_email: donorEmail,
      amount,
      frequency,
    }]).select().single()
    if (donData) setLastDonationId(donData.id)
    const displayName = anonymousDonation ? 'Anónimo' : (dedicateTo.trim() || donorName || 'Anónimo')
    await fetch('/api/send-donation-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ donorEmail, donorName: displayName, amount, communityName: selected.name, frequency, dedicateTo: anonymousDonation ? '' : dedicateTo, dedicateEmail: anonymousDonation ? '' : dedicateEmail })
    })
    await fetch('/api/send-community-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ communityEmail: selected.contact_email, communityName: selected.name, amount, donorDisplayName: displayName })
    }).catch(() => {})
    setShowCheckout(false)
    setDonated(true)
  }

  const reset = () => {
    setDonated(false); setSelected(null); setAmount(180); setCustomAmount('')
    setDedicateTo(''); setDedicateEmail(''); setFrequency('única')
    setLastDonationId(null); setAnonymousDonation(false)
    fetchCommunities()
  }

  if (donated && selected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-emerald-500 fill-emerald-200" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-3">¡Gracias por donar!</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Tu donación de <strong className="text-emerald-600">${amount.toLocaleString()} MXN</strong> a{' '}
            <strong>{selected.name}</strong> fue procesada.
            {dedicateTo && <span> Dedicada a <strong>{dedicateTo}</strong>.</span>}
          </p>

          <button onClick={reset} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors text-sm">
            Donar a otra comunidad
          </button>
        </div>
      </div>
    )
  }

  if (showCheckout && selected) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-6">
        <div className="max-w-md mx-auto">
          <button onClick={() => setShowCheckout(false)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium mb-6">
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-black text-gray-900 mb-6">Datos de pago</h2>
            <DonationCheckout
              amount={amount}
              communityName={selected.name}
              communityId={selected.id}
              stripeAccountId={selected.stripe_account_id}
              donorEmail={donorEmail}
              donorName={donorName}
              onSuccess={handleDonationSuccess}
              onCancel={() => setShowCheckout(false)}
            />
          </div>
        </div>
      </div>
    )
  }

  if (selected) {
    const col = getColor(selected.category)
    return (
      <>
        <Head><title>{selected.name} — Donekta</title></Head>
        <div className="min-h-screen bg-gray-50">
          <div className="bg-white border-b border-gray-100 px-6 py-4">
            <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium">
              <ArrowLeft className="w-4 h-4" /> Volver a comunidades
            </button>
          </div>
          <div className="max-w-2xl mx-auto px-6 py-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {selected.image_url
                ? <img src={selected.image_url} alt={selected.name} className="w-full max-h-96 object-contain" />
                : <div style={{ backgroundColor: col.banner }} className="h-32" />
              }
              <div className="p-8">
                <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3" style={{ backgroundColor: col.bg, color: col.text }}>
                  {selected.category}
                </span>
                <h1 className="text-2xl font-black text-gray-900 mb-2">{selected.name}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                  {selected.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{selected.city}{selected.state ? `, ${selected.state}` : ''}</span>}
                  {selected.beneficiaries && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{selected.beneficiaries}</span>}
                </div>
                {(selected.description || selected.mission) && (
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">{selected.description || selected.mission}</p>
                )}

                <div className="mb-6">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Frecuencia de donación</p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {(['única', 'mensual', 'trimestral', 'semestral', 'anual'] as const).map(f => (
                      <button key={f} onClick={() => setFrequency(f)}
                        className={`py-2.5 text-xs rounded-xl border-2 font-semibold capitalize transition-all ${frequency === f ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                  {frequency !== 'única' && (
                    <p className="text-xs text-emerald-600 mt-2">✓ Se cobrará ${amount.toLocaleString()} MXN de forma {frequency}</p>
                  )}
                </div>

                <p className="text-sm font-semibold text-gray-700 mb-3">Elige un monto</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  {[180, 1800, 18000, 180000].map(a => (
                    <button key={a} onClick={() => { setAmount(a); setCustomAmount('') }}
                      className={`py-2.5 text-sm rounded-xl border-2 font-semibold transition-all ${amount === a && !customAmount ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      ${a.toLocaleString()}
                    </button>
                  ))}
                </div>
                <div className="relative mb-4">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input type="number" placeholder="Otro monto" value={customAmount}
                    onChange={e => { setCustomAmount(e.target.value); setAmount(Number(e.target.value)) }}
                    className="w-full border border-gray-200 rounded-xl pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400" />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nombre en la donación <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <div className="flex gap-2 mb-2">
                    <button onClick={() => { setAnonymousDonation(false); setDedicateTo('') }}
                      className={`flex-1 py-2 text-sm rounded-xl border-2 font-medium transition-all ${!anonymousDonation ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500'}`}>
                      Mi nombre
                    </button>
                    <button onClick={() => { setAnonymousDonation(true); setDedicateTo(''); setDedicateEmail('') }}
                      className={`flex-1 py-2 text-sm rounded-xl border-2 font-medium transition-all ${anonymousDonation ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500'}`}>
                      Anónimo
                    </button>
                    <button onClick={() => { setAnonymousDonation(false) }}
                      className={`flex-1 py-2 text-sm rounded-xl border-2 font-medium transition-all ${!anonymousDonation && dedicateTo ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500'}`}>
                      Dedicar a alguien
                    </button>
                  </div>
                  {!anonymousDonation && (
                    <input type="text" placeholder="Nombre de la persona"
                      value={dedicateTo} onChange={e => setDedicateTo(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400 mb-2" />
                  )}
                  {!anonymousDonation && dedicateTo && (
                    <>
                      <input type="email" placeholder="Correo de esa persona (opcional)"
                        value={dedicateEmail} onChange={e => setDedicateEmail(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400" />
                      <p className="text-xs text-emerald-600 mt-1.5">
                        ✓ Dedicada a <strong>{dedicateTo}</strong>
                        {dedicateEmail ? <> — el certificado llegará a <strong>{dedicateEmail}</strong></> : ' — el certificado llegará a tu correo'}
                      </p>
                    </>
                  )}
                  {anonymousDonation && <p className="text-xs text-gray-400 mt-1">Tu nombre no aparecerá en el certificado ni correos.</p>}
                </div>

                <button onClick={() => setShowCheckout(true)} disabled={amount < 1}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors text-base flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  Donar ${amount.toLocaleString()} MXN con tarjeta
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head><title>Comunidades — Donekta</title></Head>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-100 px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <button onClick={() => window.location.href = '/'} className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer" style={{ background: 'none', border: 'none' }}>
              <img src="/logo-donekta-oscuro.svg" alt="Donekta" style={{ height: 32 }} />
            </button>
            <div className="flex items-center gap-4">
              <a href="/profile" className="text-sm text-gray-500 hover:text-gray-700">Mi perfil</a>
              <button onClick={() => { supabase.auth.signOut(); window.location.href = '/' }}
                className="text-sm text-gray-400 hover:text-gray-600">
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Comunidades</h1>
          <p className="text-gray-500 mb-8">Elige la comunidad que quieres apoyar hoy</p>
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar por nombre, categoría o ciudad..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-400 bg-white" />
          </div>
          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400">{search ? 'No encontramos comunidades' : 'Aún no hay comunidades aprobadas'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(c => {
                const col = getColor(c.category)
                return (
                  <button key={c.id} onClick={() => setSelected(c)}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden text-left hover:shadow-md hover:border-emerald-200 transition-all duration-200 group">
                    {c.image_url
                      ? <img src={c.image_url} alt={c.name} className="w-full max-h-48 object-contain" />
                      : <div style={{ backgroundColor: col.banner }} className="h-24" />
                    }
                    <div className="p-5">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: col.bg, color: col.text }}>{c.category}</span>
                      <h3 className="font-bold text-gray-900 mt-2 mb-1 group-hover:text-emerald-700">{c.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                        {c.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.city}</span>}
                        {c.beneficiaries && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.beneficiaries}</span>}
                      </div>
                      {c.description && <p className="text-xs text-gray-500 line-clamp-2">{c.description}</p>}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
