import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { Heart, CheckCircle, Upload } from 'lucide-react'
import { supabase } from '../lib/supabase'

const CATEGORIES = ['Alimentación','Educación','Salud','Vivienda','Medio ambiente','Arte y cultura','Derechos humanos','Otro']

export default function CommunityEdit() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [community, setCommunity] = useState<any>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', category: '', mission: '', description: '',
    beneficiaries: '', city: '', state: '', goal_amount: '',
    website: '', facebook: '', instagram: '', contact_phone: '',
    customCategory: ''
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/'); return }
      const email = session.user.email
      const { data, error } = await supabase
        .from('communities').select('*').eq('contact_email', email).eq('status', 'approved').single()
      if (error || !data) {
        const { data: pending } = await supabase.from('communities').select('status').eq('contact_email', email).single()
        router.push(pending?.status === 'pending' ? '/community-pending' : '/donor')
        return
      }
      setCommunity(data)
      const knownCategories = ['Alimentación','Educación','Salud','Vivienda','Medio ambiente','Arte y cultura','Derechos humanos','Otro']
      const savedCategory = data.category || ''
      const isKnown = knownCategories.includes(savedCategory)
      setForm({
        name: data.name || '', category: isKnown ? savedCategory : 'Otro', mission: data.mission || '',
        description: data.description || '', beneficiaries: data.beneficiaries || '',
        city: data.city || '', state: data.state || '', goal_amount: data.goal_amount?.toString() || '',
        website: data.website || '', facebook: data.facebook || '',
        instagram: data.instagram || '', contact_phone: data.contact_phone || '',
        customCategory: isKnown ? '' : savedCategory
      })
      if (data.image_url) setImagePreview(data.image_url)
      setLoading(false)
    }
    load()
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!community) return
    setSaving(true); setError('')
    try {
      let imageUrl = community.image_url || null
      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const path = `${community.id}.${ext}`
        const { error: uploadError } = await supabase.storage.from('Donekta').upload(path, imageFile, { upsert: true })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('Donekta').getPublicUrl(path)
        imageUrl = urlData.publicUrl
      }
      const finalCategory = form.category === 'Otro' && form.customCategory.trim() ? form.customCategory.trim() : form.category
      const { error: updateError } = await supabase.from('communities').update({
        name: form.name, category: finalCategory, mission: form.mission,
        description: form.description, beneficiaries: form.beneficiaries,
        city: form.city, state: form.state, goal_amount: Number(form.goal_amount) || 0,
        website: form.website, facebook: form.facebook, instagram: form.instagram,
        contact_phone: form.contact_phone, image_url: imageUrl,
      }).eq('id', community.id)
      if (updateError) throw updateError
      setDone(true)
    } catch (e: any) {
      setError(e.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (done) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center max-w-md w-full">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-3">¡Perfil actualizado!</h1>
        <p className="text-gray-500 text-sm mb-6">Tu comunidad ya aparece con la información nueva.</p>
        <button onClick={() => setDone(false)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-8 rounded-xl text-sm">
          Seguir editando
        </button>
      </div>
    </div>
  )

  return (
    <>
      <Head><title>Editar perfil — Donekta</title></Head>
      <div className="min-h-screen bg-gray-50 py-10 px-6">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center">
                <Heart className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Donekta</span>
            </div>
            <div className="flex gap-4">
              <a href="/donor" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">Ver plataforma</a>
              <button onClick={() => { supabase.auth.signOut(); router.push('/') }}
                className="text-sm text-gray-400 hover:text-gray-600">Cerrar sesión</button>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-black text-gray-900 mb-6">Editar perfil de comunidad</h2>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Imagen de la comunidad</label>
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-full max-h-96 object-contain rounded-xl mb-2" />
                  <label className="absolute bottom-4 right-4 bg-white text-gray-700 text-xs font-semibold px-3 py-2 rounded-lg shadow cursor-pointer hover:bg-gray-50 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" /> Cambiar imagen
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-emerald-400">
                  <Upload className="w-8 h-8 text-gray-300 mb-2" />
                  <span className="text-sm text-gray-400">Subir imagen</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre *</label>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nombre de la comunidad"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => set('category', c)}
                      className={`text-sm py-2 px-3 rounded-xl border-2 text-left transition-all ${form.category === c ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold' : 'border-gray-200 text-gray-600'}`}>
                      {c}
                    </button>
                  ))}
                </div>
                {form.category === 'Otro' && (
                  <input type="text" value={form.customCategory} onChange={e => set('customCategory', e.target.value)}
                    placeholder="Escribe tu categoría" autoFocus
                    className="mt-2 w-full border border-emerald-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500" />
                )}
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Misión</label>
                <textarea value={form.mission} onChange={e => set('mission', e.target.value)} rows={3} placeholder="¿Qué hace tu comunidad?"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400 resize-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Describe tu comunidad..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400 resize-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Ciudad</label>
                  <input type="text" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Ciudad"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Estado</label>
                  <input type="text" value={form.state} onChange={e => set('state', e.target.value)} placeholder="Estado"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Beneficiarios</label>
                <input type="text" value={form.beneficiaries} onChange={e => set('beneficiaries', e.target.value)} placeholder="Ej. 500 familias"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Facebook</label>
                  <input type="text" value={form.facebook} onChange={e => set('facebook', e.target.value)} placeholder="@tupagina"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Instagram</label>
                  <input type="text" value={form.instagram} onChange={e => set('instagram', e.target.value)} placeholder="@tuinstagram"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400" /></div>
              </div>
            </div>
            {error && <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
            <button onClick={handleSave} disabled={saving || !form.name}
              className="w-full mt-8 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm">
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
