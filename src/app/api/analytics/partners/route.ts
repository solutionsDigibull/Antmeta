import { NextResponse } from 'next/server'
import { getAuthenticatedUser, getUserRole, isAdminRole, unauthorized, forbidden } from '@/lib/api-helpers'
import { dbPartnerToPartner } from '@/lib/supabase/converters'

export async function GET() {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()
  if (!isAdminRole(getUserRole(user!))) return forbidden()

  const { data, error: dbError } = await supabase
    .from('partners')
    .select('*')
    .order('total_aum', { ascending: false })

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  const partners = (data || []).map(dbPartnerToPartner)

  return NextResponse.json({ data: partners })
}
