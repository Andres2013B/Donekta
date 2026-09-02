import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { email, password, secret } = req.body
  if (secret !== 'donekta-admin-2026') return res.status(403).json({ error: 'No autorizado' })

  const { data: users } = await supabase.auth.admin.listUsers()
  const user = users?.users?.find((u: any) => u.email === email)
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

  const { error } = await supabase.auth.admin.updateUserById(user.id, { password })
  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ ok: true })
}
