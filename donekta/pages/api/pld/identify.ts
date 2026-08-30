import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import formidable from 'formidable'
import fs from 'fs'

export const config = { api: { bodyParser: false } }

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const form = formidable({ maxFileSize: 10 * 1024 * 1024 })
  const [fields, files] = await form.parse(req)

  const donorEmail = fields.donorEmail?.[0]
  const fullName = fields.fullName?.[0]
  const rfcOrCurp = fields.rfcOrCurp?.[0]
  const address = fields.address?.[0]
  const sourceOfFunds = fields.sourceOfFunds?.[0]
  const idDocument = files.idDocument?.[0]

  if (!donorEmail || !fullName || !address || !sourceOfFunds || !idDocument) {
    return res.status(400).json({ error: 'Faltan campos requeridos' })
  }

  const fileBuffer = fs.readFileSync(idDocument.filepath)
  const filePath = `${donorEmail}/${Date.now()}-${idDocument.originalFilename}`

  const { error: uploadError } = await supabase.storage
    .from('pld-documents')
    .upload(filePath, fileBuffer, { contentType: idDocument.mimetype || 'application/octet-stream' })

  if (uploadError) {
    console.error('[PLD] Error subiendo documento:', uploadError)
    return res.status(500).json({ error: 'Error subiendo documento' })
  }

  const { error: upsertError } = await supabase.from('donor_identities').upsert(
    {
      donor_email: donorEmail,
      full_name: fullName,
      rfc_or_curp: rfcOrCurp || null,
      address,
      id_document_url: filePath,
      declared_source_of_funds: sourceOfFunds,
      verified_at: new Date().toISOString(),
    },
    { onConflict: 'donor_email' }
  )

  if (upsertError) {
    console.error('[PLD] Error guardando expediente:', upsertError)
    return res.status(500).json({ error: 'Error guardando expediente' })
  }

  await supabase
    .from('pld_alerts')
    .update({ status: 'identified' })
    .eq('donor_email', donorEmail)
    .eq('status', 'pending_identification')

  return res.status(200).json({ ok: true })
}
