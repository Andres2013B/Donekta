import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia' as any,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { amount, communityName } = req.body
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount) * 100),
      currency: 'mxn',
      automatic_payment_methods: { enabled: true },
      metadata: { communityName: communityName || '' },
    })
    return res.status(200).json({ clientSecret: paymentIntent.client_secret })
  } catch (error: any) {
    return res.status(500).json({ error: error.message })
  }
}
