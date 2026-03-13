import { NextResponse } from 'next/server'
import { getAuthenticatedUser, getUserRole, isAdminOrSupport, unauthorized, forbidden } from '@/lib/api-helpers'
import { dbKycToKycItem } from '@/lib/supabase/converters'

export async function GET() {
  const { user, supabase, error } = await getAuthenticatedUser()
  if (error) return unauthorized()
  if (!isAdminOrSupport(getUserRole(user!))) return forbidden()

  // Get clients with pending KYC + their docs in a single query
  const { data: clients, error: dbError } = await supabase
    .from('clients')
    .select('*, user:users(*), kyc_documents(*)')
    .in('kyc_status', ['pending', 'submitted'])
    .order('joined_at', { ascending: false })

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  const items = (clients || []).map((client) =>
    dbKycToKycItem(
      client,
      client.user?.name || '',
      client.user?.account_type || 'individual',
      client.kyc_documents || []
    )
  )

  return NextResponse.json({ data: items })
}
