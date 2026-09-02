import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hssxfehpfihwbxfykkzj.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhzc3hmZWhwZmlod2J4Znlra3pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNDg0OTksImV4cCI6MjA5NDcyNDQ5OX0.oZ3HLhupZfs57uIUh3wyf-nTgMIWh1B777GCI-vGn7o'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Community {
  id: string
  name: string
  rfc?: string
  address?: string
  city: string
  state?: string
  category: string
  mission?: string
  description?: string
  beneficiaries?: string
  contact_name?: string
  contact_email: string
  contact_phone?: string
  website?: string
  facebook?: string
  instagram?: string
  stripe_account_id?: string
  image_url: string
  goal_amount: number
  raised_amount: number
  status: string
  edit_key?: string
  created_at: string
}
