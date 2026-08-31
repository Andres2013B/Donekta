import Head from 'next/head'
import { Clock, Heart } from 'lucide-react'
export default function CommunityPending() {
  return (
    <>
      <Head><title>Solicitud enviada — Donekta</title></Head>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-3">¡Solicitud enviada!</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Revisaremos tu solicitud en 1-3 días hábiles. Te notificaremos por correo cuando sea aprobada.
          </p>
          <a href="/" className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-8 rounded-xl transition-colors text-sm">
            Volver al inicio
          </a>
        </div>
      </div>
    </>
  )
}
