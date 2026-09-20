import { useState, useEffect } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'
import { Copy, Check, ExternalLink } from 'lucide-react'

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export default function Enlaces() {
  const router = useRouter()
  const [communities, setCommunities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(typeof window !== 'undefined' ? window.location.origin : '')
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || session.user.email !== 'andresbraver@gmail.com') { router.push('/'); return }
      const { data } = await supabase.from('communities').select('*').eq('status', 'approved').order('name')
      setCommunities(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const copyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <>
      <Head><title>Enlaces de instituciones — Donekta</title></Head>
      <div className="min-h-screen bg-gray-50 py-10 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-gray-900">Enlaces de instituciones</h1>
            <p className="text-sm text-gray-500 mt-1">
              Cada institución tiene su propia página de donación. Comparte el enlace o genera un QR con él.
            </p>
          </div>

          <div className="space-y-3">
            {communities.map((c: any) => {
              const slug = slugify(c.name)
              const url = origin + '/' + slug
              return (
                <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center gap-4 mb-3">
                    {c.image_url && (
                      <div className="w-14 h-14 flex items-center justify-center flex-shrink-0">
                        <img src={c.image_url} alt={c.name} className="max-h-full max-w-full object-contain" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 truncate font-mono">
                      {url}
                    </div>
                    <button onClick={() => copyLink(url, c.id)}
                      className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded-lg flex-shrink-0">
                      {copied === c.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied === c.id ? 'Copiado' : 'Copiar'}
                    </button>
                    <a href={'/' + slug} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold px-3 py-2 rounded-lg flex-shrink-0">
                      <ExternalLink className="w-3.5 h-3.5" /> Abrir
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
