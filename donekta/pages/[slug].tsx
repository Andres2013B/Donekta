import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import DonationCheckout from '../components/DonationCheckout'

const MONTOS = [180, 500, 1800, 5000]

// Convierte "Colegio Olamí ORT" -> "colegio-olami-ort"
function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export default function InstitucionPage() {
  const router = useRouter()
  const { slug } = router.query

  const [community, setCommunity] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [amount, setAmount] = useState(500)
  const [customAmount, setCustomAmount] = useState('')
  const [donorName, setDonorName] = useState('')
  const [donorEmail, setDonorEmail] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [donated, setDonated] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) return
    const load = async () => {
      setLoading(true)
      const { data: all } = await supabase.from('communities').select('*').eq('status', 'approved')
      const comm = (all || []).find((c: any) => slugify(c.name) === slug)
      if (comm) {
        setCommunity(comm)
        const { data: projs } = await supabase.from('projects')
          .select('*').eq('community_id', comm.id).eq('status', 'active')
          .order('created_at', { ascending: false })
        setProjects(projs || [])
      }
      setLoading(false)
    }
    load()
  }, [slug])

  const finalAmount = customAmount ? Number(customAmount) : amount

  const handleDonate = () => {
    setError('')
    if (!donorEmail.trim()) { setError('Escribe tu correo para enviarte el certificado.'); return }
    if (finalAmount < 10) { setError('El monto mínimo es $10 MXN.'); return }
    setShowCheckout(true)
  }

  const handleSuccess = async () => {
    if (!community) return
    await supabase.from('communities').update({
      raised_amount: (community.raised_amount || 0) + finalAmount
    }).eq('id', community.id)

    if (selectedProject) {
      await supabase.from('projects').update({
        raised_amount: (selectedProject.raised_amount || 0) + finalAmount
      }).eq('id', selectedProject.id)
      setProjects(ps => ps.map(p => p.id === selectedProject.id
        ? { ...p, raised_amount: (p.raised_amount || 0) + finalAmount } : p))
    }

    const displayName = anonymous ? 'Anónimo' : (donorName.trim() || 'Anónimo')

    await supabase.from('donations').insert([{
      community_id: community.id,
      donor_name: displayName,
      donor_email: donorEmail,
      amount: finalAmount,
      frequency: 'única',
    }])

    await fetch('/api/send-donation-confirmation', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        donorEmail, donorName: displayName, amount: finalAmount,
        communityName: selectedProject ? community.name + ' — ' + selectedProject.name : community.name,
        frequency: 'única'
      })
    }).catch(() => {})

    await fetch('/api/send-community-notification', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        communityEmail: community.contact_email, communityName: community.name,
        amount: finalAmount, donorDisplayName: displayName
      })
    }).catch(() => {})

    setShowCheckout(false)
    setDonated(true)
  }

  const reset = () => {
    setDonated(false); setSelectedProject(null); setAmount(500); setCustomAmount('')
    setDonorName(''); setDonorEmail(''); setAnonymous(false); setError('')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFBFC' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #55B584', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (!community) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#FAFBFC', padding: 24, textAlign: 'center' }}>
      <p style={{ color: '#121826', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Institución no encontrada</p>
      <p style={{ color: '#6F737D', fontSize: 14, marginBottom: 24 }}>Verifica el enlace o explora todas las instituciones.</p>
      <a href="/donor" style={{ background: '#55B584', color: '#fff', fontWeight: 700, fontSize: 14, padding: '12px 28px', borderRadius: 100, textDecoration: 'none' }}>
        Ver instituciones
      </a>
    </div>
  )

  const brand = community.brand_color || '#55B584'
  const brandLight = brand + '14'
  const brandShadow = brand + '4D'

  if (donated) return (
    <>
      <Head><title>¡Gracias! — {community.name}</title></Head>
      <div style={{ minHeight: '100vh', background: '#FAFBFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 24, padding: 48, textAlign: 'center', maxWidth: 460, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>💚</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#121826', marginBottom: 12 }}>¡Gracias por donar!</h1>
          <p style={{ color: '#6F737D', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
            Tu donación de <strong style={{ color: brand }}>${finalAmount.toLocaleString('es-MX')} MXN</strong>
            {selectedProject && <> a <strong>{selectedProject.name}</strong></>} fue procesada correctamente.
          </p>
          <p style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 28 }}>
            Te enviamos tu certificado de donación a <strong>{donorEmail}</strong>
          </p>
          <button onClick={reset} style={{ background: brand, color: '#fff', fontWeight: 700, fontSize: 15, padding: '14px 32px', borderRadius: 100, border: 'none', cursor: 'pointer' }}>
            Hacer otra donación
          </button>
        </div>
      </div>
    </>
  )

  if (showCheckout) return (
    <>
      <Head><title>Pago — {community.name}</title></Head>
      <div style={{ minHeight: '100vh', background: '#FAFBFC', padding: '40px 24px' }}>
        <div style={{ maxWidth: 460, margin: '0 auto', background: '#fff', borderRadius: 24, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <DonationCheckout
            amount={finalAmount}
            communityName={selectedProject ? community.name + ' — ' + selectedProject.name : community.name}
            communityId={community.id}
            donorEmail={donorEmail}
            donorName={anonymous ? 'Anónimo' : donorName}
            onSuccess={handleSuccess}
            onCancel={() => setShowCheckout(false)}
          />
        </div>
      </div>
    </>
  )

  return (
    <>
      <Head>
        <title>Donar — {community.name}</title>
        <meta name="description" content={'Apoya a ' + community.name + '. Dona en segundos, de forma segura.'} />
      </Head>

      <div style={{ minHeight: '100vh', background: '#FAFBFC' }}>
        {/* HEADER CON LOGO GRANDE */}
        <div style={{ background: '#fff', borderBottom: '1px solid #F0F4F8', padding: '28px 24px' }}>
          <div style={{ maxWidth: 620, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            {community.image_url
              ? <img src={community.image_url} alt={community.name} style={{ height: 80, maxWidth: 240, objectFit: 'contain' }} />
              : <span style={{ fontSize: 20, fontWeight: 900, color: '#121826' }}>{community.name}</span>
            }
            <a href="/" style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'none', flexShrink: 0 }}>Powered by Donekta</a>
          </div>
        </div>

        <div style={{ background: brandLight, padding: '48px 24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#121826', marginBottom: 12, lineHeight: 1.2 }}>
            Apoya a {community.name}
          </h1>
          <p style={{ fontSize: 16, color: '#6F737D', maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
            {community.mission || 'Tu donación llega directo a la institución. Elige a qué proyecto quieres apoyar y dona en menos de un minuto.'}
          </p>
        </div>

        <div style={{ maxWidth: 620, margin: '0 auto', padding: '40px 24px 80px' }}>

          {projects.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#121826', marginBottom: 16 }}>¿A qué quieres apoyar?</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button onClick={() => setSelectedProject(null)}
                  style={{
                    width: '100%', textAlign: 'left', padding: 20, borderRadius: 16, cursor: 'pointer',
                    border: !selectedProject ? '2px solid ' + brand : '2px solid #E5E7EB',
                    background: !selectedProject ? brandLight : '#fff',
                  }}>
                  <p style={{ fontWeight: 700, color: '#121826', fontSize: 15, marginBottom: 4 }}>Donación general</p>
                  <p style={{ fontSize: 13, color: '#6F737D' }}>La institución decide dónde se necesita más.</p>
                </button>

                {projects.map((p: any) => {
                  const pct = p.goal_amount > 0 ? Math.min(100, ((p.raised_amount || 0) / p.goal_amount) * 100) : 0
                  const active = selectedProject?.id === p.id
                  return (
                    <button key={p.id} onClick={() => setSelectedProject(p)}
                      style={{
                        width: '100%', textAlign: 'left', padding: 20, borderRadius: 16, cursor: 'pointer',
                        border: active ? '2px solid ' + brand : '2px solid #E5E7EB',
                        background: active ? brandLight : '#fff',
                      }}>
                      <p style={{ fontWeight: 700, color: '#121826', fontSize: 15, marginBottom: 4 }}>{p.name}</p>
                      {p.description && <p style={{ fontSize: 13, color: '#6F737D', marginBottom: 12, lineHeight: 1.5 }}>{p.description}</p>}
                      {p.goal_amount > 0 && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>
                            <span><strong style={{ color: brand }}>${(p.raised_amount || 0).toLocaleString('es-MX')}</strong> recaudados</span>
                            <span>Meta: ${p.goal_amount.toLocaleString('es-MX')}</span>
                          </div>
                          <div style={{ width: '100%', background: '#E5E7EB', borderRadius: 100, height: 6 }}>
                            <div style={{ width: pct + '%', background: brand, height: 6, borderRadius: 100, transition: 'width 0.4s' }} />
                          </div>
                        </>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#121826', marginBottom: 16 }}>Elige un monto</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
              {MONTOS.map(m => (
                <button key={m} onClick={() => { setAmount(m); setCustomAmount('') }}
                  style={{
                    padding: '14px 0', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer',
                    border: (!customAmount && amount === m) ? '2px solid ' + brand : '2px solid #E5E7EB',
                    background: (!customAmount && amount === m) ? brandLight : '#fff',
                    color: (!customAmount && amount === m) ? brand : '#6F737D',
                  }}>
                  ${m.toLocaleString('es-MX')}
                </button>
              ))}
            </div>
            <input type="number" placeholder="$ Otro monto" value={customAmount}
              onChange={e => setCustomAmount(e.target.value)}
              style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 12, padding: '14px 16px', fontSize: 15, outline: 'none' }} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#121826', marginBottom: 16 }}>Tus datos</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input type="email" placeholder="Tu correo *" value={donorEmail}
                onChange={e => setDonorEmail(e.target.value)}
                style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 12, padding: '14px 16px', fontSize: 15, outline: 'none' }} />
              {!anonymous && (
                <input type="text" placeholder="Tu nombre (opcional)" value={donorName}
                  onChange={e => setDonorName(e.target.value)}
                  style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 12, padding: '14px 16px', fontSize: 15, outline: 'none' }} />
              )}
              <div onClick={() => setAnonymous(!anonymous)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '4px 0' }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                  border: anonymous ? 'none' : '2px solid #D1D5DB',
                  background: anonymous ? brand : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {anonymous && <span style={{ color: '#fff', fontSize: 13, fontWeight: 900 }}>✓</span>}
                </div>
                <span style={{ fontSize: 14, color: '#6F737D' }}>Donar de forma anónima</span>
              </div>
            </div>
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', fontSize: 14, padding: '12px 16px', borderRadius: 12, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button onClick={handleDonate}
            style={{
              width: '100%', background: brand, color: '#fff', fontWeight: 800, fontSize: 17,
              padding: '18px 0', borderRadius: 100, border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 16px ' + brandShadow,
            }}>
            Donar ${finalAmount.toLocaleString('es-MX')} MXN
          </button>

          <div style={{ marginTop: 28, padding: 20, background: '#fff', borderRadius: 16, border: '1px solid #F0F4F8' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12 }}>¿A dónde va tu donación?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6F737D' }}>💚 {community.name} (94.4%)</span>
                <strong style={{ color: brand }}>${(finalAmount * 0.944).toLocaleString('es-MX', { maximumFractionDigits: 2 })}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9CA3AF' }}>💳 Stripe (3.6%)</span>
                <span style={{ color: '#9CA3AF' }}>${(finalAmount * 0.036).toLocaleString('es-MX', { maximumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9CA3AF' }}>🌱 Donekta (2%)</span>
                <span style={{ color: '#9CA3AF' }}>${(finalAmount * 0.02).toLocaleString('es-MX', { maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 20, lineHeight: 1.6 }}>
            Pago seguro procesado por Stripe · Recibirás tu certificado por correo
          </p>

          {/* BOTÓN A DONEKTA */}
          <div style={{ marginTop: 32, padding: 24, background: brandLight, borderRadius: 16, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: '#374151', fontWeight: 600, marginBottom: 6 }}>
              ¿Quieres apoyar a otras instituciones?
            </p>
            <p style={{ fontSize: 13, color: '#6F737D', marginBottom: 16, lineHeight: 1.5 }}>
              Explora todas las comunidades verificadas en Donekta.
            </p>
            <a href="/donor" style={{
              display: 'inline-block', background: brand, color: '#fff', fontWeight: 700,
              fontSize: 14, padding: '12px 28px', borderRadius: 100, textDecoration: 'none',
            }}>
              Ver todas las instituciones →
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
