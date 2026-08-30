import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const { data: alerts } = await supabase
    .from('pld_alerts')
    .select('*, donor_identities:donor_email(full_name, rfc_or_curp, address, declared_source_of_funds)')
    .order('created_at', { ascending: false })

  const rows = [
    ['donor_email','full_name','rfc_or_curp','address','declared_source_of_funds','accumulated_amount_mxn','period_start','period_end','status'],
    ...(alerts ?? []).map((a: any) => [
      a.donor_email,
      a.donor_identities?.full_name ?? '',
      a.donor_identities?.rfc_or_curp ?? '',
      a.donor_identities?.address ?? '',
      a.donor_identities?.declared_source_of_funds ?? '',
      a.accumulated_amount_mxn,
      a.period_start,
      a.period_end,
      a.status,
    ]),
  ]

  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename="pld-alertas-${new Date().toISOString().slice(0,10)}.csv"`)
  return res.status(200).send(csv)
}
