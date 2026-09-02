import { useState } from 'react'
import { useRouter } from 'next/router'
import { X, Heart } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Props { onClose: () => void }
type Mode = 'login' | 'register' | 'reset'
type Step = 'form' | 'otp' | 'new-password'

export default function AuthModal({ onClose }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [step, setStep] = useState<Step>('form')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [name, setName] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)

  const go = (m: Mode) => { setMode(m); setStep('form'); setOtp(''); setError(''); setNewPass(''); setConfirmPass('') }

  const loginSend = async () => {
    setError('')
    if (!email || !password) { setError('Llena todos los campos.'); return }
    setLoading(true)
    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({ email, password })
      if (authErr) throw new Error('Correo o contraseña incorrectos')
      await supabase.auth.signOut()
      const r = await fetch('/api/otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', email, type: 'login' })
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Error al enviar código')
      setStep('otp')
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const loginVerify = async () => {
    setError('')
    if (otp.length !== 6) { setError('Ingresa el código de 6 dígitos.'); return }
    setLoading(true)
    try {
      const r = await fetch('/api/otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', email, code: otp, type: 'login' })
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      const { error: authErr } = await supabase.auth.signInWithPassword({ email, password })
      if (authErr) {
        const resetRes = await fetch('/api/reset-password-temp', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, secret: 'donekta-admin-2026' })
        })
        if (resetRes.ok) {
          await new Promise(r => setTimeout(r, 500))
          const { error: retryErr } = await supabase.auth.signInWithPassword({ email, password })
          if (retryErr) throw new Error('Contraseña incorrecta. Verifica e intenta de nuevo.')
        } else {
          throw new Error('Contraseña incorrecta. Verifica e intenta de nuevo.')
        }
      }
      if (email === 'andresbraver@gmail.com') { router.push('/admin') }
      else {
        const { data: comm } = await supabase.from('communities').select('id').eq('contact_email', email).eq('status', 'approved').single()
        router.push(comm ? '/community-edit' : '/donor')
      }
      onClose()
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const register = async () => {
    setError('')
    if (!email || !password) { setError('Llena todos los campos.'); return }
    if (!acceptedTerms) { setError('Debes aceptar los Términos y Condiciones.'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name, user_type: 'donor' } } })
      if (error) throw error
      onClose(); router.push('/donor')
    } catch (e: any) { setError(e.message || 'Ocurrió un error') }
    finally { setLoading(false) }
  }

  const resetSend = async () => {
    setError('')
    if (!email) { setError('Escribe tu correo.'); return }
    setLoading(true)
    try {
      const r = await fetch('/api/otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', email, type: 'reset' })
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setStep('otp')
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const resetVerify = () => {
    setError('')
    if (otp.length !== 6) { setError('Ingresa el código de 6 dígitos.'); return }
    setStep('new-password')
  }

  const resetNewPassword = async () => {
    setError('')
    if (!newPass || !confirmPass) { setError('Llena todos los campos.'); return }
    if (newPass.length < 6) { setError('Mínimo 6 caracteres.'); return }
    if (newPass !== confirmPass) { setError('Las contraseñas no coinciden.'); return }
    setLoading(true)
    try {
      const r = await fetch('/api/otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', email, code: otp, newPassword: newPass, type: 'reset' })
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      go('login')
      alert('✅ ¡Contraseña actualizada! Ya puedes iniciar sesión.')
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const Err = () => error ? <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div> : null

  const TermsModal = () => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 overflow-y-auto scroll-momentum">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-black text-gray-900">Términos y Condiciones</h3>
          <button onClick={() => setShowTerms(false)} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="overflow-y-auto p-5 text-sm text-gray-600 space-y-4">
          <p><strong className="text-gray-900">1. Aceptación</strong><br />Al usar Donekta, aceptas estos términos.</p>
          <p><strong className="text-gray-900">2. Servicio</strong><br />Donekta conecta donadores con comunidades verificadas en México. Cobramos 2% por donación para mantener la plataforma.</p>
          <p><strong className="text-gray-900">3. Donaciones</strong><br />Las donaciones son voluntarias y no reembolsables salvo error técnico comprobable.</p>
          <p><strong className="text-gray-900">4. Pagos</strong><br />Los pagos se procesan de forma segura a través de Stripe. No almacenamos datos de tarjetas.</p>
          <p><strong className="text-gray-900">5. Responsabilidad</strong><br />Donekta actúa como intermediario y no es responsable por el uso de los fondos una vez transferidos.</p>
          <p><strong className="text-gray-900">6. Contacto</strong><br />hola@donekta.com</p>
        </div>
        <div className="p-5 border-t border-gray-100">
          <button onClick={() => { setShowTerms(false); setAcceptedTerms(true) }} className="w-full bg-emerald-500 text-white font-semibold py-2.5 rounded-xl text-sm">Aceptar y cerrar</button>
        </div>
      </div>
    </div>
  )

  const PrivacyModal = () => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 overflow-y-auto scroll-momentum">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-black text-gray-900">Política de Privacidad</h3>
          <button onClick={() => setShowPrivacy(false)} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="overflow-y-auto p-5 text-sm text-gray-600 space-y-4">
          <p><strong className="text-gray-900">1. Datos</strong><br />Recopilamos nombre, correo y datos de donaciones. No almacenamos datos de tarjetas.</p>
          <p><strong className="text-gray-900">2. Uso</strong><br />Para procesar donaciones y mejorar la plataforma. No vendemos tus datos.</p>
          <p><strong className="text-gray-900">3. Seguridad</strong><br />Encriptación SSL + Stripe PCI DSS.</p>
          <p><strong className="text-gray-900">4. Derechos</strong><br />Puedes solicitar eliminar tu cuenta escribiendo a hola@donekta.com</p>
        </div>
        <div className="p-5 border-t border-gray-100">
          <button onClick={() => { setShowPrivacy(false); setAcceptedTerms(true) }} className="w-full bg-emerald-500 text-white font-semibold py-2.5 rounded-xl text-sm">Aceptar y cerrar</button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto scroll-momentum" style={{ paddingTop: 'max(16px, env(safe-area-inset-top))', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
        <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden my-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
                <Heart className="w-3.5 h-3.5 text-white fill-white" />
              </div>
              <span className="font-bold text-gray-900">Donekta</span>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>

          <div className="p-6">
            {/* OTP */}
            {step === 'otp' && (
              <div className="space-y-4">
                <div className="text-center mb-2">
                  <div className="text-3xl mb-3">📧</div>
                  <h2 className="text-xl font-black text-gray-900 mb-1">Revisa tu correo</h2>
                  <p className="text-sm text-gray-500">Código enviado a <strong>{email}</strong></p>
                </div>
                <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000" maxLength={6}
                  onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? loginVerify() : resetVerify())}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-3xl tracking-widest font-mono focus:outline-none focus:border-emerald-400" />
                <Err />
                <button onClick={mode === 'login' ? loginVerify : resetVerify} disabled={loading || otp.length !== 6}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm">
                  {loading ? 'Verificando...' : 'Continuar →'}
                </button>
                <button onClick={() => { setStep('form'); setOtp(''); setError('') }}
                  className="w-full text-sm text-gray-400 hover:text-gray-600 py-2">← Volver</button>
              </div>
            )}

            {/* NUEVA CONTRASEÑA */}
            {step === 'new-password' && (
              <div className="space-y-4">
                <div className="text-center mb-2">
                  <h2 className="text-xl font-black text-gray-900 mb-1">Nueva contraseña</h2>
                  <p className="text-sm text-gray-500">Elige una nueva contraseña para tu cuenta</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nueva contraseña</label>
                  <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Mínimo 6 caracteres"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar contraseña</label>
                  <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Repite tu contraseña"
                    onKeyDown={e => e.key === 'Enter' && resetNewPassword()}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400" />
                </div>
                <Err />
                <button onClick={resetNewPassword} disabled={loading || !newPass || !confirmPass}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm">
                  {loading ? 'Guardando...' : 'Guardar contraseña'}
                </button>
              </div>
            )}

            {/* RECUPERAR CONTRASEÑA */}
            {step === 'form' && mode === 'reset' && (
              <div className="space-y-4">
                <div className="text-center mb-2">
                  <div className="text-3xl mb-3">🔒</div>
                  <h2 className="text-xl font-black text-gray-900 mb-1">Recuperar contraseña</h2>
                  <p className="text-sm text-gray-500">Te enviaremos un código a tu correo</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo electrónico</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com"
                    onKeyDown={e => e.key === 'Enter' && resetSend()}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400" />
                </div>
                <Err />
                <button onClick={resetSend} disabled={loading || !email}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm">
                  {loading ? 'Enviando...' : 'Enviar código →'}
                </button>
                <button onClick={() => go('login')} className="w-full text-sm text-gray-400 hover:text-gray-600 py-2">← Volver al login</button>
              </div>
            )}

            {/* LOGIN / REGISTRO */}
            {step === 'form' && mode !== 'reset' && (
              <>
                <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                  <button onClick={() => go('login')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>Iniciar sesión</button>
                  <button onClick={() => go('register')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'register' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>Registrarse</button>
                </div>
                <div className="space-y-4">
                  {mode === 'register' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre completo</label>
                      <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400" />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo electrónico</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres"
                      onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? loginSend() : register())}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400" />
                  </div>
                  {mode === 'login' && (
                    <button type="button" onClick={() => go('reset')} className="text-xs text-emerald-600 hover:text-emerald-700 text-right w-full -mt-2">
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                  {mode === 'register' && (
                    <div className="flex items-start gap-3 p-3 rounded-xl border-2 border-gray-100">
                      <div className={`w-5 h-5 mt-0.5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all cursor-pointer ${acceptedTerms ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}
                        onClick={() => setAcceptedTerms(!acceptedTerms)}>
                        {acceptedTerms && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className="text-xs text-gray-600">
                        Acepto los{' '}
                        <span onClick={() => setShowTerms(true)} className="text-emerald-600 underline font-medium cursor-pointer">Términos y Condiciones</span>
                        {' '}y la{' '}
                        <span onClick={() => setShowPrivacy(true)} className="text-emerald-600 underline font-medium cursor-pointer">Política de Privacidad</span>
                      </span>
                    </div>
                  )}
                  <Err />
                  <button onClick={mode === 'login' ? loginSend : register} disabled={loading || !email || !password}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm">
                    {loading ? 'Cargando...' : mode === 'login' ? 'Continuar →' : 'Crear cuenta'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {showTerms && <TermsModal />}
      {showPrivacy && <PrivacyModal />}
    </>
  )
}
