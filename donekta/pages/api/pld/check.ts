import type { NextApiRequest, NextApiResponse } from 'next'
import { checkDonorAccumulation } from '../../../../lib/pld/check-donor-threshold'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { donorEmail } = req.body
  if (!donorEmail) return res.status(400).json({ error: 'Email requerido' })
  const result = await checkDonorAccumulation(donorEmail)
  return res.status(200).json(result)
}
