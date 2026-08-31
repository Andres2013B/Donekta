import type { NextApiRequest, NextApiResponse } from 'next'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

function clean(v: string | undefined): string {
  if (!v) return ''
  return v.trim().replace(/^["']|["']$/g, '')
}

const REDIS_URL = clean(process.env.UPSTASH_REDIS_REST_URL)
const REDIS_TOKEN = clean(process.env.UPSTASH_REDIS_REST_TOKEN)

async function redisCmd(...args: string[]) {
  if (!REDIS_URL || !REDIS_TOKEN) {
    throw new Error('Redis no configurado: faltan UPSTASH_REDIS_REST_URL o UPSTASH_REDIS_REST_TOKEN en Vercel')
  }
  const url = `${REDIS_URL}/${args.map(encodeURIComponent).join('/')}`
  const r = await fetch(url, { headers: { Authorization: `Bearer ${REDIS_TOKEN}` } })
  if (!r.ok) {
    const text = await r.text()
    throw new Error(`Redis error: ${r.status} - ${text}`)
  }
  return r.json()
}

async function sendEmail(to: string, code: string, type: string) {
  const subject = type === 'reset' ? 'Recupera tu contraseña — Donekta' : 'Tu código de acceso — Donekta'
  const title = type === 'reset' ? 'Código para recuperar tu contraseña:' : 'Tu código de acceso:'
  await resend.emails.send({
    from: 'Donekta <hola@donekta.com>',
    to,
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;">
        <h1 style="color:#121826;font-size:22px;font-weight:900;text-align:center;margin-bottom:4px;">Donekta</h1>
        <p style="color:#6F737D;font-size:13px;text-align:center;margin-bottom:32px;">Dona con propósito</p>
        <div style="background:#EDFBF4;border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">
          <p style="color:#6F737D;font-size:14px;margin-bottom:20px;">${title}</p>
          <div style="font-size:52px;font-weight:900;color:#55B584;letter-spacing:14px;font-family:monospace;">${code}</div>
          <p style="color:#9CA3AF;font-size:12px;margin-top:16px;">Expira en 10 minutos.</p>
        </div>
        <p style="color:#9CA3AF;font-size:11px;text-align:center;">Si no solicitaste esto, ignora este correo.</p>
      </div>
    `
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { action, email, code, newPassword, type = 'login' } = req.body

    if (action === 'send') {
      if (!email) return res.status(400).json({ error: 'Email requerido' })
      const otp = String(Math.floor(Math.random() * 1000000)).padStart(6, '0')
      const key = `otp:${type}:${email}`

      await redisCmd('set', key, otp, 'EX', '600')

      await sendEmail(email, otp, type)
      return res.status(200).json({ ok: true })
    }

    if (action === 'verify') {
      if (!email || !code) return res.status(400).json({ error: 'Datos incompletos' })
      const key = `otp:${type}:${email}`
      const result = await redisCmd('get', key)
      const stored = result.result

      if (!stored) return res.status(400).json({ error: 'Solicita un nuevo código' })
      if (stored !== code) return res.status(400).json({ error: 'Código incorrecto' })

      await redisCmd('del', key)

      if (type === 'reset') {
        if (!newPassword) return res.status(400).json({ error: 'Nueva contraseña requerida' })
        let allUsers: any[] = []
        let page = 1
        while (true) {
          const { data, error: listErr } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
          if (listErr) throw listErr
          allUsers = allUsers.concat(data.users)
          if (data.users.length < 1000) break
          page++
        }
        const user = allUsers.find((u: any) => u.email?.toLowerCase().trim() === email.toLowerCase().trim())
        if (!user) return res.status(404).json({ error: `No encontramos una cuenta con ese correo (${email})` })
        const { error } = await supabase.auth.admin.updateUserById(user.id, { password: newPassword })
        if (error) throw error
      }

      return res.status(200).json({ ok: true })
    }

    return res.status(400).json({ error: 'Acción inválida' })
  } catch (e: any) {
    console.error('OTP Error:', e)
    return res.status(500).json({ error: e.message || 'Error interno del servidor' })
  }
}
