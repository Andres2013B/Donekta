import type { NextApiRequest, NextApiResponse } from 'next'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { donorName, donorEmail, amount, communityName, frequency, dedicateTo, dedicateEmail } = req.body

  if (!donorEmail) return res.status(400).json({ error: 'Email requerido' })

  const name = donorName || 'Donador'
  const freqText = frequency && frequency !== 'única' ? ` (donación ${frequency})` : ''
  const institution = communityName || 'una comunidad'

  // Si se dedicó la donación a alguien con correo, el certificado llega a esa persona.
  // Si no, llega al correo de la cuenta que donó.
  const recipientEmail = (dedicateEmail && dedicateEmail.trim()) ? dedicateEmail.trim() : donorEmail
  const certificateName = (dedicateTo && dedicateTo.trim()) ? dedicateTo.trim() : name

  let attachments: { filename: string; content: Buffer }[] = []
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://donekta.vercel.app'
    const certUrl = `${siteUrl}/api/certificate?name=${encodeURIComponent(certificateName)}&amount=${encodeURIComponent(amount)}&institution=${encodeURIComponent(institution)}`
    const certRes = await fetch(certUrl)
    if (certRes.ok) {
      const buf = Buffer.from(await certRes.arrayBuffer())
      attachments = [{ filename: 'certificado-donekta.png', content: buf }]
    }
  } catch (_) {
    // Si falla la generación del certificado, igual enviamos el correo de confirmación.
  }

  try {
    await resend.emails.send({
      from: 'Donekta <hola@donekta.com>',
      to: recipientEmail,
      subject: '¡Gracias por tu donación! — Donekta',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;">
          <h1 style="color:#121826;font-size:22px;font-weight:900;text-align:center;margin-bottom:4px;">Donekta</h1>
          <p style="color:#6F737D;font-size:13px;text-align:center;margin-bottom:32px;">Dona con propósito</p>

          <div style="background:#EDFBF4;border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">
            <div style="font-size:40px;margin-bottom:12px;">💚</div>
            <p style="color:#121826;font-size:18px;font-weight:700;margin-bottom:8px;">${certificateName}, ¡muchas gracias por donar en Donekta!</p>
            <p style="color:#6F737D;font-size:14px;line-height:1.6;">Tu donación de <strong style="color:#55B584;">$${Number(amount).toLocaleString()} MXN</strong>${freqText} a <strong>${institution}</strong> ya está en camino para generar un cambio real.</p>
          </div>

          <p style="color:#6F737D;font-size:13px;text-align:center;margin-bottom:24px;">Adjuntamos tu certificado de donación 🎖️</p>

          <div style="text-align:center;">
            <a href="https://donekta.com" style="display:inline-block;background:#55B584;color:#fff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:100px;text-decoration:none;">🌱 Tú también puedes donar: donekta.com</a>
          </div>

          <p style="color:#9CA3AF;font-size:12px;text-align:center;margin-top:32px;">Gracias por ser parte del cambio. — El equipo de Donekta</p>
        </div>
      `,
      attachments,
    })
    return res.status(200).json({ ok: true })
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Error al enviar correo' })
  }
}
