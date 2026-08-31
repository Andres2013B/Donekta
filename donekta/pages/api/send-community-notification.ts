import type { NextApiRequest, NextApiResponse } from 'next'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { communityEmail, communityName, amount, donorDisplayName } = req.body
  if (!communityEmail) return res.status(400).json({ error: 'Email requerido' })

  const communityAmount = (Number(amount) * 0.944).toFixed(2)
  const stripeAmount = (Number(amount) * 0.036).toFixed(2)
  const donektaAmount = (Number(amount) * 0.02).toFixed(2)
  const donorLabel = donorDisplayName || 'Anónimo'

  try {
    await resend.emails.send({
      from: 'Donekta <hola@donekta.com>',
      to: communityEmail,
      subject: `¡Recibiste una donación! — Donekta`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;">
          <h1 style="color:#121826;font-size:22px;font-weight:900;text-align:center;margin-bottom:4px;">Donekta</h1>
          <p style="color:#6F737D;font-size:13px;text-align:center;margin-bottom:32px;">Dona con propósito</p>

          <div style="background:#EDFBF4;border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">
            <div style="font-size:40px;margin-bottom:12px;">💚</div>
            <p style="color:#121826;font-size:18px;font-weight:700;margin-bottom:8px;">¡${communityName} recibió una donación!</p>
            <p style="color:#6F737D;font-size:14px;line-height:1.6;">
              <strong>${donorLabel}</strong> donó <strong style="color:#55B584;">$${Number(amount).toLocaleString('es-MX')} MXN</strong>
            </p>
          </div>

          <div style="border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;margin-bottom:24px;">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid #e5e7eb;">
              <span style="font-size:13px;color:#374151;">💚 Para ${communityName} <span style="color:#9ca3af;">(94.4%)</span></span>
              <strong style="color:#55B584;">$${Number(communityAmount).toLocaleString('es-MX')} MXN</strong>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid #e5e7eb;background:#f9fafb;">
              <span style="font-size:13px;color:#374151;">💳 Stripe <span style="color:#9ca3af;">(3.6%)</span></span>
              <span style="color:#6b7280;">$${Number(stripeAmount).toLocaleString('es-MX')} MXN</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#f9fafb;">
              <span style="font-size:13px;color:#374151;">🌱 Donekta <span style="color:#9ca3af;">(2%)</span></span>
              <span style="color:#6b7280;">$${Number(donektaAmount).toLocaleString('es-MX')} MXN</span>
            </div>
          </div>

          <p style="color:#9CA3AF;font-size:12px;text-align:center;margin-top:32px;">Gracias por ser parte del cambio. — El equipo de Donekta</p>
        </div>
      `,
    })
    return res.status(200).json({ ok: true })
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Error al enviar correo' })
  }
}
